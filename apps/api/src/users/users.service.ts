import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FriendshipStatus } from 'src/generated/prisma/enums';

const userSelect = {
  id: true,
  email: true,
  nickname: true,
  role: true,
  bio: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private trimField(value: string): string {
    return value.trim();
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    return user;
  }
  async updateMe(userId: string, dto: UpdateUserDto) {
    const data: { nickname?: string; bio?: string | null } = {};
    if (dto.nickname !== undefined) {
      const nickname = this.trimField(dto.nickname);
      const taken = await this.prisma.user.findFirst({
        where: { nickname, NOT: { id: userId } },
      });
      if (taken) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
      data.nickname = nickname;
    }
    if (dto.bio !== undefined) {
      const bio = dto.bio;
      data.bio = bio === '' ? null : bio;
    }
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: userSelect,
      });
    } catch {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
  }

  // 공개 프로필 조회
  async findPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        image: true,
        bio: true,
      },
    });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    return user;
  }

  //block
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('자기 자신을 차단할 수 없습니다.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });

    // 진행 중 , 맞친구 관계정리
    await this.prisma.friendship.updateMany({
      where: {
        OR: [
          { requesterId: blockerId, addresseeId: blockedId },
          { requesterId: blockedId, addresseeId: blockerId },
        ],
        status: { in: [FriendshipStatus.pending, FriendshipStatus.accepted] },
      },
      data: {
        status: FriendshipStatus.removed,
        respondedAt: new Date(),
      },
    });
  }

  async unblockerUser(blockerId: string, blockedId: string) {
    const result = await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    if (result.count === 0) {
      throw new NotFoundException('차단 기록을 찾을 수 없습니다.');
    }
  }

  async getBlockStatus(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      return { blockedByMe: false };
    }
    const row = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      select: { id: true },
    });
    return { blockedByMe: row !== null };
  }
}
