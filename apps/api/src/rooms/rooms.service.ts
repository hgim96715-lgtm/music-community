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

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateRoomDto) {
    const visibility = dto.visibility ?? RoomVisibility.public;
    const topicTags = dto.topicTags ?? [];

    return this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        topicTags,
        visibility,
        ownerId,
        memberCount: 1,
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
  }

  async listPublic() {
    return this.prisma.room.findMany({
      where: {
        status: RoomStatus.active,
        visibility: RoomVisibility.public,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
  }

  async findById(roomId: string) {
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

  async join(roomId: string, userId: string) {
    const room = await this.findById(roomId);

    if (room.visibility !== RoomVisibility.public) {
      throw new ForbiddenException(
        '초대·비공개 방은 초대 없이 입장할 수 없습니다.',
      );
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
        include: {
          sender: {
            select: { id: true, nickname: true, image: true },
          },
        },
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
      include: {
        sender: {
          select: { id: true, nickname: true, image: true },
        },
      },
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
    return this.prisma.roomMessage.findMany({
      where: { roomId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
  }

  async update(roomId: string, userId: string, dto: UpdateRoomDto) {
    const room = await this.findById(roomId);
    if (room.ownerId !== userId) {
      throw new ForbiddenException('방장만 방을 수정할 수 있습니다.');
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.topicTags !== undefined ? { topicTags: dto.topicTags } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
      },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });
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
    return this.prisma.room.findMany({
      where: {
        status: RoomStatus.active,
        members: { some: { userId } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, nickname: true, image: true },
        },
      },
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
