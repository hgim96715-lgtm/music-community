import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RoomMemberRole,
  RoomMessageType,
  RoomStatus,
  RoomVisibility,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateRoomMessageDto } from './dto/create-room-message.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Prisma } from 'src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 12;

const roomMessageInclude = {
  sender: {
    select: { id: true, nickname: true, image: true },
  },
  recommendation: {
    select: {
      id: true,
      title: true,
      artist: true,
      embedUrl: true,
      moods: true,
    },
  },
} as const;

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /** API로 나갈 때 hash 제거 · hint는 두기  */
  private toClientRoom<T extends { passwordHash?: string | null }>(room: T) {
    const { passwordHash: _, ...rest } = room;
    return rest;
  }

  async create(ownerId: string, dto: CreateRoomDto) {
    const visibility = dto.visibility ?? RoomVisibility.public;
    const topicTags = dto.topicTags ?? [];

    let passwordHash: string | null = null;
    let passwordHint: string | null = null;

    if (visibility === RoomVisibility.private) {
      const plain = dto.password?.trim();
      if (!plain) {
        throw new BadRequestException('비공개 방은 비밀번호가 있어야 합니다.');
      }
      passwordHash = await bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
      passwordHint = dto.passwordHint?.trim() || null;
    }

    const room = await this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        topicTags,
        visibility,
        ownerId,
        memberCount: 1,
        passwordHash,
        passwordHint,
        members: {
          create: {
            userId: ownerId,
            role: RoomMemberRole.owner,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
    return this.toClientRoom(room);
  }

  async listPublic() {
    return this.prisma.room
      .findMany({
        where: {
          status: RoomStatus.active,
          visibility: { in: [RoomVisibility.public, RoomVisibility.private] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, nickname: true, image: true },
          },
        },
      })
      .then((rooms) => rooms.map((r) => this.toClientRoom(r)));
  }

  /** DB 원본 (hash 포함) · join/update 검사용 */
  private async findRoomOrThrow(roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        status: RoomStatus.active,
      },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
    if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
    return room;
  }

  /** API 조회 · hash 제거 */
  async findById(roomId: string) {
    return this.toClientRoom(await this.findRoomOrThrow(roomId));
  }

  async join(roomId: string, userId: string, password?: string) {
    const room = await this.findRoomOrThrow(roomId);

    if (room.visibility === RoomVisibility.invite) {
      throw new ForbiddenException('초대 없이 입장할 수 없습니다.');
    }
    if (room.visibility === RoomVisibility.private) {
      if (!room.passwordHash) {
        throw new ForbiddenException('비공개 방 비밀번호가 없습니다.');
      }
      if (!password?.trim()) {
        throw new BadRequestException('비밀번호를 입력해 주세요.');
      }
      const ok = await bcrypt.compare(password, room.passwordHash);
      if (!ok) {
        throw new ForbiddenException('비밀번호가 일치하지 않습니다.');
      }
    }

    const banned = await this.prisma.roomBan.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (banned) {
      throw new ForbiddenException('이 방에 다시 들어갈 수 없습니다.');
    }
    const existing = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    });
    if (existing) {
      return existing;
    }

    try {
      const [member] = await this.prisma.$transaction([
        this.prisma.roomMember.create({
          data: {
            roomId,
            userId,
            role: RoomMemberRole.member,
          },
        }),
        this.prisma.room.update({
          where: { id: roomId },
          data: { memberCount: { increment: 1 } },
        }),
      ]);
      return member;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const again = await this.prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId } },
        });
        if (again) return again;
      }
      throw error;
    }
  }

  async leave(roomId: string, userId: string) {
    const room = await this.findById(roomId);
    if (room.ownerId === userId) {
      throw new ForbiddenException(
        '방장은 퇴장할 수 없습니다. 방을 닫거나 방장을 넘겨 주세요.',
      );
    }
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new NotFoundException('방에 속하지 않은 사용자입니다.');
    await this.prisma.$transaction([
      this.prisma.roomMember.delete({
        where: { id: member.id },
      }),
      this.prisma.room.update({
        where: { id: roomId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
  }

  async createMessage(
    roomId: string,
    senderId: string,
    dto: CreateRoomMessageDto,
  ) {
    await this.findById(roomId);
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: senderId } },
    });
    if (!member) {
      throw new ForbiddenException('방 멤버만 메시지를 보낼 수 있습니다.');
    }
    if (member.mutedUntil && member.mutedUntil > new Date()) {
      throw new ForbiddenException('채팅이 제한된 상태 입니다.');
    }
    if (dto.type === RoomMessageType.text) {
      const body = dto.body?.trim();
      if (!body) {
        throw new BadRequestException('메시지 내용을 입력해 주세요.');
      }
      return this.prisma.roomMessage.create({
        data: {
          roomId,
          senderId,
          type: RoomMessageType.text,
          body,
        },
        include: roomMessageInclude,
      });
    }

    if (dto.type === RoomMessageType.saved_card) {
      if (!dto.savedCardId) {
        throw new BadRequestException('공유할 포토카드가 필요합니다.');
      }
      const card = await this.prisma.savedCard.findFirst({
        where: { id: dto.savedCardId, userId: senderId },
        select: {
          id: true,
          customization: true,
          createdAt: true,
          recommendation: {
            select: {
              id: true,
              title: true,
              artist: true,
              embedUrl: true,
              moods: true,
              reason: true,
              createdAt: true,
            },
          },
        },
      });
      if (!card) throw new NotFoundException('내 포토카드가 아니거나 없어요.');
      const msg = await this.prisma.roomMessage.create({
        data: {
          roomId,
          senderId,
          type: RoomMessageType.saved_card,
          savedCardId: card.id,
          recommendationId: card.recommendation.id,
        },
        include: roomMessageInclude,
      });
      return {
        ...msg,
        savedCard: {
          id: card.id,
          createdAt: card.createdAt,
          customization: card.customization,
          recommendation: card.recommendation,
        },
      };
    }

    if (dto.type === RoomMessageType.lyric_quote) {
      const body = dto.body?.trim();
      if (!body) {
        throw new BadRequestException('가사 내용을 입력해 주세요.');
      }
      if (!dto.recommendationId) {
        throw new BadRequestException('가사를 붙일 곡이 필요합니다.');
      }
      const start = dto.lyricStartSec;
      const end = dto.lyricEndSec;
      if (start !== undefined && end !== undefined && end < start) {
        throw new BadRequestException('끝 시각은 시작 시각 이후여야 해요.');
      }
      const recommendation = await this.prisma.recommendation.findFirst({
        where: { id: dto.recommendationId, hidden: false },
        select: { id: true },
      });
      if (!recommendation) {
        throw new NotFoundException('존재하지 않는 추천 글입니다.');
      }
      return this.prisma.roomMessage.create({
        data: {
          roomId,
          senderId,
          type: RoomMessageType.lyric_quote,
          body,
          recommendationId: dto.recommendationId,
          lyricStartSec: start,
          lyricEndSec: end,
        },
        include: roomMessageInclude,
      });
    }

    if (!dto.recommendationId) {
      throw new BadRequestException('공유할 추천 글이 필요합니다.');
    }
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: dto.recommendationId, hidden: false },
      select: { id: true },
    });
    if (!recommendation) {
      throw new NotFoundException('존재하지 않는 추천 글입니다.');
    }
    return this.prisma.roomMessage.create({
      data: {
        roomId,
        senderId,
        type: RoomMessageType.recommendation,
        recommendationId: dto.recommendationId,
      },
      include: roomMessageInclude,
    });
  }

  async listMessages(roomId: string, userId: string) {
    await this.findById(roomId);
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true },
    });
    if (!member) {
      throw new ForbiddenException('방 멤버만 메시지를 조회할 수 있습니다.');
    }
    const messages = await this.prisma.roomMessage.findMany({
      where: { roomId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: roomMessageInclude,
    });
    const cardIds = [
      ...new Set(
        messages
          .filter((m) => m.type === RoomMessageType.saved_card && m.savedCardId)
          .map((m) => m.savedCardId!),
      ),
    ];
    if (cardIds.length === 0) {
      return messages.map((m) => ({ ...m, savedCard: null }));
    }
    const cards = await this.prisma.savedCard.findMany({
      where: { id: { in: cardIds } },
      select: {
        id: true,
        customization: true,
        createdAt: true,
        recommendation: {
          select: {
            id: true,
            title: true,
            artist: true,
            embedUrl: true,
            moods: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });
    const byId = new Map(cards.map((c) => [c.id, c]));

    return messages.map((m) => {
      if (m.type !== RoomMessageType.saved_card || !m.savedCardId) {
        return { ...m, savedCard: null };
      }
      const card = byId.get(m.savedCardId);
      if (!card) return { ...m, savedCard: null };
      return {
        ...m,
        savedCard: {
          id: card.id,
          createdAt: card.createdAt,
          customization: card.customization,
          recommendation: card.recommendation,
        },
      };
    });
  }

  async update(roomId: string, userId: string, dto: UpdateRoomDto) {
    const room = await this.findRoomOrThrow(roomId);
    if (room.ownerId !== userId) {
      throw new ForbiddenException('방장만 방을 수정할 수 있습니다.');
    }

    const nextVisibility = dto.visibility ?? room.visibility;
    let passwordHash: string | null | undefined;
    let passwordHint: string | null | undefined;

    if (dto.passwordHint !== undefined) {
      passwordHint = dto.passwordHint?.trim() || null;
    }
    if (dto.password !== undefined) {
      const plain = dto.password.trim();
      if (plain) {
        passwordHash = await bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
      }
    }

    if (nextVisibility === RoomVisibility.public) {
      passwordHash = null;
      passwordHint = null;
    } else if (nextVisibility === RoomVisibility.private) {
      const willHave = passwordHash ?? room.passwordHash;
      if (!willHave) {
        throw new BadRequestException('비공개 방은 비밀번호가 있어야 합니다.');
      }
    }
    return this.toClientRoom(
      await this.prisma.room.update({
        where: { id: roomId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.topicTags !== undefined ? { topicTags: dto.topicTags } : {}),
          ...(dto.visibility !== undefined
            ? { visibility: dto.visibility }
            : {}),
          ...(passwordHash !== undefined ? { passwordHash } : {}),
          ...(passwordHint !== undefined ? { passwordHint } : {}),
        },
        include: {
          owner: {
            select: { id: true, nickname: true, image: true },
          },
        },
      }),
    );
  }

  async deleteMessage(roomId: string, messageId: string, userId: string) {
    await this.findById(roomId);
    const message = await this.prisma.roomMessage.findFirst({
      where: { id: messageId, roomId, deletedAt: null },
    });
    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { ownerId: true },
    });
    const isOwner = room?.ownerId === userId;
    const isSender = message.senderId === userId;
    if (!isOwner && !isSender) {
      throw new ForbiddenException(
        '본인 메시지 또는 방장만 삭제할 수 있습니다.',
      );
    }
    await this.prisma.roomMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  async listMine(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        status: RoomStatus.active,
        members: { some: { userId } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });
    return rooms.map((room) => {
      const { messages, ...rest } = this.toClientRoom(room);
      const at = messages[0]?.createdAt;
      return {
        ...rest,
        lastMessageAt:
          at instanceof Date ? at.toISOString() : at ? String(at) : null,
      };
    });
  }

  /** 멤버만 · owner 먼저 · 나머지 joinedAt */
  async listMembers(roomId: string, userId: string) {
    await this.findById(roomId);
    const me = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true },
    });
    if (!me) {
      throw new ForbiddenException('방 멤버만 멤버 목록을 조회할 수 있습니다.');
    }
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
    return members.sort((a, b) => {
      if (a.role === RoomMemberRole.owner && b.role !== RoomMemberRole.owner)
        return -1;
      if (b.role === RoomMemberRole.owner && a.role !== RoomMemberRole.owner)
        return 1;
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });
  }

  async close(roomId: string, actorId: string) {
    const room = await this.findById(roomId);
    if (room.ownerId !== actorId) {
      throw new ForbiddenException('방장만 방을 닫을 수 있습니다.');
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: { status: RoomStatus.closed },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
  }

  async transfer(roomId: string, actorId: string, newOwnerId: string) {
    const room = await this.findById(roomId);
    if (room.ownerId !== actorId) {
      throw new ForbiddenException('방장만 방을 넘길 수 있습니다.');
    }
    if (newOwnerId === actorId) {
      throw new BadRequestException('자기 자신을 방장으로 넘길 수 없습니다.');
    }

    const target = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: newOwnerId } },
    });
    if (!target) {
      throw new NotFoundException('방에 속하지 않은 사용자 입니다.');
    }
    const oldOwner = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: room.ownerId } },
    });
    if (!oldOwner) {
      throw new NotFoundException('방장 멤버 정보를 찾을 수 없습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.room.update({
        where: { id: roomId },
        data: { ownerId: newOwnerId },
      }),
      this.prisma.roomMember.update({
        where: { id: target.id },
        data: { role: RoomMemberRole.owner },
      }),
      this.prisma.roomMember.update({
        where: { id: oldOwner.id },
        data: { role: RoomMemberRole.member },
      }),
    ]);
    return this.findById(roomId);
  }

  async kick(roomId: string, actorId: string, targetUserId: string) {
    const room = await this.findById(roomId);
    if (room.ownerId !== actorId) {
      throw new ForbiddenException('방장만 멤버를 내보낼 수 있습니다.');
    }
    if (targetUserId === actorId) {
      throw new BadRequestException('자기 자신은 강퇴할 수 없습니다.');
    }
    if (targetUserId === room.ownerId) {
      throw new BadRequestException(
        '방장은 강퇴할 수 없습니다. 방장 넘기기를 사용하세요.',
      );
    }
    const target = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    if (!target) {
      throw new NotFoundException('방에 속하지 않은 사용자 입니다.');
    }
    if (target.role === RoomMemberRole.owner) {
      throw new BadRequestException('방장은 강퇴할 수 없습니다.');
    }
    await this.prisma.$transaction([
      this.prisma.roomBan.upsert({
        where: { roomId_userId: { roomId, userId: targetUserId } },
        create: { roomId, userId: targetUserId, kickedBy: actorId },
        update: { kickedBy: actorId },
      }),
      this.prisma.roomMember.delete({ where: { id: target.id } }),
      this.prisma.room.update({
        where: { id: roomId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
  }
}
