import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RoomStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListAdminRoomsQueryDto } from './dto/list-admin-rooms-query.dto';

@Injectable()
export class AdminRoomsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
