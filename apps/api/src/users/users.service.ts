import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FriendshipStatus } from 'src/generated/prisma/enums';
import { WithdrawUserDto } from './dto/withdraw-user.dto';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const userSelect = {
  id: true,
  email: true,
  nickname: true,
  role: true,
  bio: true,
  deletedAt: true,
  withdrawScheduledAt: true,
} as const;

const WITHDRAW_GRACE_DAYS = 7;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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
    return {
      ...user,
      deletedAt: user.deletedAt?.toISOString() ?? null,
      withdrawScheduledAt: user.withdrawScheduledAt?.toISOString() ?? null,
    };
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
  /** POST /users/me/withdraw — 탈퇴 예약 (7일 유예) */
  async withdrawMe(userId: string, dto: WithdrawUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        passwordHash: true,
        deletedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    if (user.deletedAt) {
      throw new BadRequestException('이미 탈퇴가 예정된 계정입니다.');
    }

    const confirm = this.trimField(dto.confirm);
    const matched =
      confirm === user.nickname ||
      confirm === user.email ||
      confirm === `@${user.nickname}`;
    if (!matched) {
      throw new BadRequestException(
        '확인 문구가 일치하지 않습니다. 닉네임 또는 이메일을 정확히 입력해 주세요.',
      );
    }
    if (user.passwordHash) {
      if (!dto.password) {
        throw new BadRequestException('비밀번호를 입력해 주세요.');
      }
      const ok = await bcrypt.compare(dto.password, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
      }
    }
    const deletedAt = new Date();
    const withdrawScheduledAt = new Date(
      deletedAt.getTime() + WITHDRAW_GRACE_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt, withdrawScheduledAt },
    });
    return {
      ok: true as const,
      deletedAt: deletedAt.toISOString(),
      withdrawScheduledAt: withdrawScheduledAt.toISOString(),
      graceDays: WITHDRAW_GRACE_DAYS,
    };
  }

  /** POST /users/me/withdraw/cancel — 유예 중 취소만 */
  async cancelWithdraw(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        deletedAt: true,
        withdrawScheduledAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    if (!user.deletedAt) {
      throw new BadRequestException('탈퇴가 예정되지 않은 계정입니다.');
    }
    if (!user.withdrawScheduledAt) {
      throw new ForbiddenException(
        '이미 탈퇴가 확정된 계정입니다. 고객지원으로 문의해 주세요.',
      );
    }
    if (user.withdrawScheduledAt.getTime() <= Date.now()) {
      throw new ForbiddenException(
        '유예 기간이 끝나 취소할 수 없습니다. 고객지원으로 문의해 주세요.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        withdrawScheduledAt: null,
      },
    });
    return {
      ok: true as const,
    };
  }

  /**
   * 유예 만료 계정 정리 (cron / 수동 호출)
   * - 개인 컬렉션·관계·OAuth 삭제
   * - 추천·댓글·방 메시지는 authorId 유지 → User를 익명 tombstone으로 남김 (Cascade 방지)
   * - email/nickname unique 해제 → 재가입 OK
   */

  /**
   * @returns scanned = 만료 후보 수 · finalized = 실제로 tombstone까지 간 수
   * (스킵·실패는 finalized에 안 넣음)
   */
  async finalizeExpiredWithdrawals(now = new Date(), take = 50) {
    const due = await this.prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        withdrawScheduledAt: { lte: now },
      },
      select: { id: true },
      take,
      orderBy: { withdrawScheduledAt: 'asc' },
    });
    let finalized = 0;
    for (const { id } of due) {
      try {
        if (await this.finalizeWithdrawnUser(id)) finalized += 1;
      } catch (error) {
        this.logger.error(
          `탈퇴 확정 실패 user=${id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
    return { scanned: due.length, finalized };
  }

  /** @returns true = 이번 호출에서 확정 처리함 · false = 조건 불일치로 스킵 */

  async finalizeWithdrawnUser(userId: string): Promise<boolean> {
    const stamp = userId.replace(/-/g, '').slice(0, 8);
    const nickname = `탈퇴${stamp}`;
    const email = `withdrawn+${stamp}@invalid.local`;

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, deletedAt: true, withdrawScheduledAt: true },
      });
      if (!user?.deletedAt || !user.withdrawScheduledAt) return false;
      if (user.withdrawScheduledAt.getTime() > Date.now()) return false;

      await tx.savedCard.deleteMany({ where: { userId } });
      await tx.savedLyric.deleteMany({ where: { userId } });
      await tx.reaction.deleteMany({ where: { userId } });
      await tx.oAuthAccount.deleteMany({ where: { userId } });
      await tx.friendship.deleteMany({
        where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      });
      await tx.block.deleteMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      });

      // 방장 active 방: 남은 멤버에게 넘기기 · 혼자면 닫기
      const ownedRooms = await tx.room.findMany({
        where: { ownerId: userId, status: 'active' },
        select: { id: true },
      });
      for (const { id: roomId } of ownedRooms) {
        const successor =
          (await tx.roomMember.findFirst({
            where: {
              roomId,
              userId: { not: userId },
              role: 'moderator',
            },
            orderBy: { joinedAt: 'asc' },
          })) ??
          (await tx.roomMember.findFirst({
            where: { roomId, userId: { not: userId } },
            orderBy: { joinedAt: 'asc' },
          }));

        if (successor) {
          await tx.room.update({
            where: { id: roomId },
            data: { ownerId: successor.userId },
          });
          await tx.roomMember.update({
            where: { id: successor.id },
            data: { role: 'owner' },
          });
        } else {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'closed' },
          });
        }
      }

      await tx.roomMember.deleteMany({ where: { userId } });
      await tx.roomBan.deleteMany({
        where: { OR: [{ userId }, { kickedBy: userId }] },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          email,
          nickname,
          passwordHash: null,
          image: null,
          bio: null,
          lastActiveAt: null,
          withdrawScheduledAt: null,
        },
      });
      return true;
    });
  }
}
