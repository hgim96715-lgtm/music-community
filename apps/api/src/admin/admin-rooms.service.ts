import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RoomStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListAdminRoomsQueryDto } from './dto/list-admin-rooms-query.dto';
import { UpdateAdminRoomDto } from './dto/update-admin-room.dto';
import { DmsService } from 'src/dms/dms.service';
import { ChatGateway } from 'src/realtime/chat.gateway';

@Injectable()
export class AdminRoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dmsService: DmsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private async notifyOwnerRoomStatus(opts: {
    adminUserId: string;
    ownerId: string;
    roomName: string;
    status: RoomStatus;
    reason: string;
  }) {
    const action = opts.status === RoomStatus.archived ? '보관' : '닫기';
    const body = [
      `운영이 「${opts.roomName}」 방을 ${action}했어요.`,
      `사유: ${opts.reason}`,
      '',
      '이 대화에서 운영에게 문의할 수 있어요.',
    ].join('\n');

    const dm = await this.dmsService.openOrGet(opts.adminUserId, opts.ownerId);
    const message = await this.dmsService.sendMessage(
      dm.id,
      opts.adminUserId,
      body,
    );
    this.chatGateway.emitDmMessage(dm.id, message);
    this.chatGateway.emitDmUnread(opts.ownerId, {
      dmId: dm.id,
      unread: true,
    });
  }

  async list(query: ListAdminRoomsQueryDto) {
    const take = Math.min(Math.max(query.limit ?? 30, 1), 50);
    const q = query.q?.trim();

    const where: Prisma.RoomWhereInput = {};

    if (query.status) {
      where.status = query.status as RoomStatus;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { owner: { nickname: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const rows = await this.prisma.room.findMany({
      where,
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        topicTags: true,
        visibility: true,
        status: true,
        memberCount: true,
        passwordHint: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: {
          select: { id: true, nickname: true, email: true },
        },
      },
    });
    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    return {
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      nextCursor: hasMore ? (items[items.length - 1].id ?? null) : null,
    };
  }

  async getMessage(messageId: string) {
    const row = await this.prisma.roomMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        roomId: true,
        type: true,
        body: true,
        recommendationId: true,
        deletedAt: true,
        deletedByOwner: true,
        createdAt: true,
        sender: {
          select: { id: true, nickname: true, email: true },
        },
        room: {
          select: { id: true, name: true, status: true },
        },
        recommendation: {
          select: { title: true, artist: true },
        },
      },
    });
    if (!row) throw new NotFoundException('메시지를 찾을 수 없습니다.');
    return {
      id: row.id,
      roomId: row.roomId,
      roomName: row.room.name,
      roomStatus: row.room.status,
      type: row.type,
      body: row.body,
      sender: row.sender,
      recommendationId: row.recommendationId,
      recommendationTitle: row.recommendation
        ? `${row.recommendation.title} — ${row.recommendation.artist}`
        : null,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      deletedByOwner: row.deletedByOwner,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteMessage(roomId: string, messageId: string, adminUserId: string) {
    const message = await this.prisma.roomMessage.findFirst({
      where: { id: messageId, roomId },
      select: {
        id: true,
        roomId: true,
        senderId: true,
        type: true,
        replyToId: true,
        createdAt: true,
        deletedAt: true,
        sender: { select: { id: true, nickname: true } },
        replyTo: {
          select: {
            id: true,
            body: true,
            senderId: true,
            deletedAt: true,
            sender: { select: { id: true, nickname: true } },
          },
        },
      },
    });
    if (!message) throw new NotFoundException('메시지를 찾을 수 없습니다.');
    if (message.deletedAt) {
      return {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        type: message.type,
        body: null,
        recommendationId: null,
        savedCardId: null,
        lyricStartSec: null,
        lyricEndSec: null,
        replyToId: message.replyToId,
        createdAt: message.createdAt,
        deletedAt: message.deletedAt,
        deletedByOwner: true,
        deletedById: adminUserId,
        sender: message.sender,
        recommendation: null,
        savedCard: null,
        reactions: [],
        replyTo: message.replyTo,
      };
    }
    const updated = await this.prisma.roomMessage.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedByOwner: true,
        deletedById: adminUserId,
        body: null,
        recommendationId: null,
        savedCardId: null,
        lyricStartSec: null,
        lyricEndSec: null,
      },
      select: {
        id: true,
        roomId: true,
        senderId: true,
        type: true,
        replyToId: true,
        createdAt: true,
        deletedAt: true,
        deletedByOwner: true,
        deletedById: true,
        sender: { select: { id: true, nickname: true } },
        replyTo: {
          select: {
            id: true,
            body: true,
            senderId: true,
            deletedAt: true,
            sender: { select: { id: true, nickname: true } },
          },
        },
      },
    });
    return {
      id: updated.id,
      roomId: updated.roomId,
      senderId: updated.senderId,
      type: updated.type,
      body: null,
      recommendationId: null,
      savedCardId: null,
      lyricStartSec: null,
      lyricEndSec: null,
      replyToId: updated.replyToId,
      createdAt: updated.createdAt,
      deletedAt: updated.deletedAt,
      deletedByOwner: true,
      deletedById: updated.deletedById,
      sender: updated.sender,
      recommendation: null,
      savedCard: null,
      reactions: [],
      replyTo: updated.replyTo,
    };
  }

  async update(id: string, dto: UpdateAdminRoomDto, adminUserId: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
    if (dto.status === null)
      throw new BadRequestException('변경할 필드가 없습니다.');

    const closing =
      dto.status === RoomStatus.closed || dto.status === RoomStatus.archived;
    const reason = dto.reason?.trim();
    if (closing && !reason)
      throw new BadRequestException('닫기·보관 시 사유가 필요합니다.');

    const updated = await this.prisma.room.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        name: true,
        description: true,
        topicTags: true,
        visibility: true,
        status: true,
        memberCount: true,
        passwordHint: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: {
          select: { id: true, nickname: true, email: true },
        },
      },
    });
    if (closing && reason && updated.ownerId !== adminUserId) {
      await this.notifyOwnerRoomStatus({
        adminUserId,
        ownerId: updated.ownerId,
        roomName: updated.name,
        status: dto.status,
        reason,
      });
    }
    void adminUserId;
    void reason;
    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
