import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DmStatus,
  FriendshipStatus,
  UserRole,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

/** 1:1 pairKey — 작은 uuid:큰 uuid */
export function dmPairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

const dmInclude = {
  members: {
    include: {
      user: { select: { id: true, nickname: true, image: true } },
    },
  },
} as const;

const dmMessageInclude = {
  sender: { select: { id: true, nickname: true, image: true } },
} as const;

@Injectable()
export class DmsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanDm(userId: string, otherUserId: string) {
    if (userId === otherUserId)
      throw new BadRequestException('자기 자신은 채팅할 수 없습니다.');
    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, role: true },
    });
    if (!other) throw new NotFoundException('존재하지 않는 사용자입니다.');

    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
      select: { id: true },
    });
    if (blocked)
      throw new ForbiddenException('차단된 사용자와는 DM을 할 수 없습니다.');
    return other;
  }

  private async resolveStatus(
    userId: string,
    otherUserId: string,
    otherRole: UserRole,
  ): Promise<DmStatus> {
    const me = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { role: true },
    });
    if (me.role === UserRole.admin || otherRole === UserRole.admin)
      return DmStatus.open;
    const friends = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.accepted,
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
      select: { id: true },
    });
    return friends ? DmStatus.open : DmStatus.pending;
  }

  async openOrGet(userId: string, otherUserId: string) {
    const other = await this.assertCanDm(userId, otherUserId);
    const status = await this.resolveStatus(userId, otherUserId, other.role);
    const pairKey = dmPairKey(userId, otherUserId);
    const requestedById = status === DmStatus.pending ? userId : null;

    const existing = await this.prisma.dm.findUnique({
      where: { pairKey },
      include: dmInclude,
    });
    if (existing) {
      if (existing.status === DmStatus.open) return existing;
      if (status === DmStatus.open) {
        return this.prisma.dm.update({
          where: { id: existing.id },
          data: { status: DmStatus.open, requestedById: null },
          include: dmInclude,
        });
      }
      if (existing.status === DmStatus.pending) return existing;
      return this.prisma.dm.update({
        where: { id: existing.id },
        data: { status: DmStatus.pending, requestedById: userId },
        include: dmInclude,
      });
    }
    return this.prisma.dm.create({
      data: {
        pairKey,
        status,
        requestedById,
        members: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: dmInclude,
    });
  }

  private async assertMember(dmId: string, userId: string) {
    const member = await this.prisma.dmMember.findUnique({
      where: { dmId_userId: { dmId, userId } },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('이 DM의 멤버가 아닙니다.');
  }

  async accept(dmId: string, userId: string) {
    await this.assertMember(dmId, userId);
    const dm = await this.prisma.dm.findUnique({ where: { id: dmId } });
    if (!dm) throw new NotFoundException('존재하지 않는 DM입니다.');
    if (dm.status !== DmStatus.pending) {
      throw new BadRequestException('수락할 요청이 없습니다.');
    }
    if (dm.requestedById === userId) {
      throw new ForbiddenException('내가 보낸 요청은 수락할 수 없습니다.');
    }
    return this.prisma.dm.update({
      where: { id: dmId },
      data: { status: DmStatus.open, requestedById: null },
      include: dmInclude,
    });
  }

  async decline(dmId: string, userId: string) {
    await this.assertMember(dmId, userId);
    const dm = await this.prisma.dm.findUnique({ where: { id: dmId } });
    if (!dm) throw new NotFoundException('존재하지 않는 DM입니다.');
    if (dm.status !== DmStatus.pending) {
      throw new BadRequestException('거절할 요청이 없습니다.');
    }
    if (dm.requestedById === userId) {
      throw new ForbiddenException('내가 보낸 요청은 거절할 수 없습니다.');
    }
    return this.prisma.dm.update({
      where: { id: dmId },
      data: { status: DmStatus.declined, requestedById: null },
      include: dmInclude,
    });
  }
  /** 열린 DM 목록 · 상대 + 최근 메시지 1개 */
  async listMine(userId: string) {
    const memberships = await this.prisma.dmMember.findMany({
      where: { userId, dm: { status: DmStatus.open } },
      include: {
        dm: {
          include: {
            ...dmInclude,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                body: true,
                senderId: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { dm: { updatedAt: 'desc' } },
    });
    return memberships.map(({ dm, lastReadAt }) => {
      const other = dm.members.find((m) => m.userId !== userId)?.user ?? null;
      const lastMessage = dm.messages[0] ?? null;
      const unread =
        lastMessage != null &&
        lastMessage.senderId !== userId &&
        lastMessage.createdAt > lastReadAt;
      return {
        id: dm.id,
        status: dm.status,
        updatedAt: dm.updatedAt,
        other,
        lastMessage,
        unread,
      };
    });
  }

  async findById(dmId: string, userId: string) {
    await this.assertMember(dmId, userId);
    const dm = await this.prisma.dm.findUnique({
      where: { id: dmId },
      include: dmInclude,
    });
    if (!dm) throw new NotFoundException('존재하지 않는 DM입니다.');
    if (dm.status === DmStatus.declined) {
      throw new ForbiddenException('거절된 메시지 요청입니다.');
    }
    const other = dm.members.find((m) => m.userId !== userId)?.user ?? null;
    return {
      id: dm.id,
      status: dm.status,
      requestedById: dm.requestedById,
      createdAt: dm.createdAt,
      updatedAt: dm.updatedAt,
      other,
    };
  }

  /** 내가 받은 pending 요청만 */
  async listRequests(userId: string) {
    const memberships = await this.prisma.dmMember.findMany({
      where: {
        userId,
        dm: { status: DmStatus.pending, requestedById: { not: userId } },
      },
      include: {
        dm: { include: dmInclude },
      },
      orderBy: { dm: { createdAt: 'desc' } },
    });
    return memberships.map(({ dm }) => {
      const other = dm.members.find((m) => m.userId !== userId)?.user ?? null;
      return {
        id: dm.id,
        status: dm.status,
        requestedById: dm.requestedById,
        createdAt: dm.createdAt,
        other,
      };
    });
  }

  private async getDmForMemberOrThrow(dmId: string, userId: string) {
    await this.assertMember(dmId, userId);
    const dm = await this.prisma.dm.findUnique({ where: { id: dmId } });
    if (!dm) throw new NotFoundException('존재하지 않는 DM입니다.');
    if (dm.status === DmStatus.declined) {
      throw new ForbiddenException('거절된 메시지 요청입니다.');
    }
    return dm;
  }

  async sendMessage(dmId: string, senderId: string, body: string) {
    const dm = await this.getDmForMemberOrThrow(dmId, senderId);

    if (dm.status === DmStatus.pending && dm.requestedById !== senderId) {
      throw new ForbiddenException(
        '메시지 요청을 수락한 뒤에 대화할 수 있습니다.',
      );
    }
    const otherMember = await this.prisma.dmMember.findFirst({
      where: { dmId, userId: { not: senderId } },
      select: { userId: true },
    });
    if (!otherMember)
      throw new NotFoundException('상대 멤버를 찾을 수 없습니다.');
    await this.assertCanDm(senderId, otherMember.userId);

    const text = body.trim();
    if (!text) throw new BadRequestException('메시지를 입력해주세요.');

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.dmMessage.create({
        data: { dmId, senderId, body: text },
        include: dmMessageInclude,
      });
      await tx.dm.update({
        where: { id: dmId },
        data: { updatedAt: new Date() },
      });
      await tx.dmMember.update({
        where: { dmId_userId: { dmId, userId: senderId } },
        data: { lastReadAt: new Date() },
      });
      return message;
    });
  }

  async listMessages(dmId: string, userId: string) {
    await this.getDmForMemberOrThrow(dmId, userId);
    return this.prisma.dmMessage.findMany({
      where: { dmId },
      orderBy: { createdAt: 'desc' },
      include: dmMessageInclude,
    });
  }

  async markRead(dmId: string, userId: string) {
    await this.assertMember(dmId, userId);
    const updated = await this.prisma.dmMember.update({
      where: { dmId_userId: { dmId, userId } },
      data: { lastReadAt: new Date() },
      select: { lastReadAt: true },
    });
    return {
      lastReadAt: updated.lastReadAt.toISOString(),
      unread: false,
    };
  }
}
