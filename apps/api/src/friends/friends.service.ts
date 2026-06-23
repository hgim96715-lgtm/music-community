import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFriendRequestDto } from './dto/create-friends.dto';
import { FriendshipStatus } from 'src/generated/prisma/client';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private friendshipInclude() {
    const userSelect = { id: true, nickname: true, image: true } as const;
    return {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    };
  }

  async createRequest(addresseeId: string, requesterId: string) {
    if (requesterId === addresseeId) {
      throw new BadRequestException(
        '자기 자신에게 친구 요청을 보낼 수 없습니다.',
      );
    }
    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
      select: { id: true },
    });
    if (!addressee) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: requesterId, blockedId: addresseeId },
          { blockerId: addresseeId, blockedId: requesterId },
        ],
      },
    });
    if (blocked) {
      throw new BadRequestException('친구 요청을 보낼 수 없습니다.');
    }
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.accepted) {
        throw new ConflictException('이미 친구입니다.');
      }
      if (existing.status === FriendshipStatus.pending) {
        throw new ConflictException('이미 친구 요청이 있습니다.');
      }
      if (
        existing.requesterId === requesterId &&
        existing.addresseeId === addresseeId
      ) {
        return this.prisma.friendship.update({
          where: { id: existing.id },
          data: { status: FriendshipStatus.pending, respondedAt: null },
          include: this.friendshipInclude(),
        });
      }
      throw new ConflictException('친구 요청을 보낼 수 없습니다.');
    }
    return this.prisma.friendship.create({
      data: { requesterId, addresseeId, status: FriendshipStatus.pending },
      include: this.friendshipInclude(),
    });
  }
  async respondToRequest(
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
      throw new ForbiddenException(
        '받은 사람만 수락 또는 거절 할 수 있습니다.',
      );
    }
    if (friendship.status !== FriendshipStatus.pending) {
      throw new ConflictException('처리할 수 없는 요청입니다.');
    }
    const status =
      action === 'accept'
        ? FriendshipStatus.accepted
        : FriendshipStatus.declined;

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status, respondedAt: new Date() },
      include: this.friendshipInclude(),
    });
  }

  async findRequests(userId: string) {
    const pending = { status: FriendshipStatus.pending };

    const [received, sent] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { addresseeId: userId, ...pending },
        include: this.friendshipInclude(),
      }),
      this.prisma.friendship.findMany({
        where: { requesterId: userId, ...pending },
        include: this.friendshipInclude(),
      }),
    ]);
    return { received, sent };
  }

  async findFriends(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.accepted,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: this.friendshipInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFriend(userId: string, friendUserId: string) {
    if (userId === friendUserId) {
      throw new BadRequestException('자기 자신을 친구에서 제거할 수 없습니다.');
    }

    const sentPending = await this.prisma.friendship.findFirst({
      where: {
        requesterId: userId,
        addresseeId: friendUserId,
        status: FriendshipStatus.pending,
      },
    });
    if (sentPending) {
      await this.prisma.friendship.delete({ where: { id: sentPending.id } });
      return;
    }

    const accepted = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.accepted,
        OR: [
          { requesterId: userId, addresseeId: friendUserId },
          { requesterId: friendUserId, addresseeId: userId },
        ],
      },
    });
    if (accepted) {
      await this.prisma.friendship.update({
        where: { id: accepted.id },
        data: { status: FriendshipStatus.removed },
      });
      return;
    }
    throw new NotFoundException(
      '친구 관계 또는 취소하고 싶은 요청을 찾을 수 없습니다.',
    );
  }
}
