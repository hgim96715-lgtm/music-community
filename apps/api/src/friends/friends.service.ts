import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

const friendUserSelect = {
  id: true,
  nickname: true,
  image: true,
} as const;

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertNotBlocked(a: string, b: string) {
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { id: true },
    });
    if (blocked) {
      throw new ForbiddenException(
        '차단된 사용자와는 친구 요청 할 수 없습니다.',
      );
    }
  }
  async createRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('자기자신에게 친구 요청을 할 수 없습니다.');
    }

    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
      select: { id: true },
    });
    if (!addressee) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    await this.assertNotBlocked(requesterId, addresseeId);

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    if (existing?.status === FriendshipStatus.accepted) {
      throw new ConflictException('이미 친구입니다.');
    }
    if (existing?.status === FriendshipStatus.pending) {
      throw new ConflictException('이미 친구 요청을 보낸 상태입니다.');
    }
    return this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: FriendshipStatus.pending,
      },
      include: {
        requester: { select: friendUserSelect },
        addressee: { select: friendUserSelect },
      },
    });
  }

  async respond(
    friendshipId: string,
    userId: string,
    action: 'accept' | 'decline',
  ) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('받은 요청만 응답할수 있습니다.');
    }
    if (friendship.status !== FriendshipStatus.pending) {
      throw new ConflictException('이미 응답한 요청입니다.');
    }
    if (action === 'accept') {
      await this.assertNotBlocked(friendship.requesterId, userId);
    }
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status:
          action === 'accept'
            ? FriendshipStatus.accepted
            : FriendshipStatus.declined,
        respondedAt: new Date(),
      },
      include: {
        requester: { select: friendUserSelect },
        addressee: { select: friendUserSelect },
      },
    });
  }

  async remove(userId: string, otherUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
        status: {
          in: [FriendshipStatus.accepted, FriendshipStatus.pending],
        },
      },
    });
    if (!friendship) {
      throw new NotFoundException('친구 관계 또는 요청을 찾을 수 없습니다.');
    }
    await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: {
        status: FriendshipStatus.removed,
        respondedAt: friendship.respondedAt ?? new Date(),
      },
    });
  }

  async listFriends(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: { respondedAt: 'desc' },
      include: {
        requester: { select: friendUserSelect },
        addressee: { select: friendUserSelect },
      },
    });
  }

  async listRequest(userId: string) {
    const include = {
      requester: { select: friendUserSelect },
      addressee: { select: friendUserSelect },
    } as const;

    const [received, sent] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: FriendshipStatus.pending,
        },
        orderBy: { createdAt: 'desc' },
        include,
      }),
      this.prisma.friendship.findMany({
        where: {
          requesterId: userId,
          status: FriendshipStatus.pending,
        },
        orderBy: { createdAt: 'desc' },
        include,
      }),
    ]);
    return { received, sent };
  }
}
