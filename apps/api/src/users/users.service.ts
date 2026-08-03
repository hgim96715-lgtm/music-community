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
import { FriendshipStatus, UserRole } from 'src/generated/prisma/enums';
import { WithdrawUserDto } from './dto/withdraw-user.dto';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import {
  getKstMonthKey,
  startOfKstDay,
  toKstDateKey,
} from 'src/common/kst-date';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';

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

  async searchUsers(userId: string, query: SearchUsersQueryDto) {
    const raw = query.q.trim().replace(/^@+/, '');
    if (raw.length < 2) {
      throw new BadRequestException('검색어는 2자 이상이어야 합니다.');
    }
    const take = Math.min(Math.max(query.limit ?? 20, 1), 30);
    const blocked = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const excludeIds = new Set<string>([userId]);
    for (const b of blocked) {
      excludeIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
    }

    const where = {
      deletedAt: null,
      nickname: { contains: raw, mode: 'insensitive' as const },
      id: { notIn: [...excludeIds] },
    };

    const rows = await this.prisma.user.findMany({
      where,
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ nickname: 'asc' }, { id: 'asc' }],
      select: { id: true, nickname: true, image: true },
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    return {
      items,
      nextCursor: hasMore ? (items[items.length - 1].id ?? null) : null,
    };
  }

  //block
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId)
      throw new BadRequestException('자기 자신을 차단할 수 없습니다.');

    const [me, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: blockerId },
        select: { id: true, role: true },
      }),
      this.prisma.user.findUnique({
        where: { id: blockedId },
        select: { id: true, role: true },
      }),
    ]);
    if (!target) throw new NotFoundException('유저를 찾을 수 없습니다.');
    if (!me) throw new NotFoundException('유저를 찾을 수 없습니다.');

    if (me.role === UserRole.admin || target.role === UserRole.admin)
      throw new ForbiddenException('관리자는 차단할 수 없습니다.');
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
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

  async getMyStats(userId: string) {
    const now = new Date();
    const startOfToday = startOfKstDay(now);
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000);
    const monthKey = getKstMonthKey(now);
    const startOfMonth = new Date(`${monthKey}-01T00:00:00+09:00`);

    const periodCounts = async (count: (gte?: Date) => Promise<number>) => {
      const [week, month, total] = await Promise.all([
        count(startOfWeek),
        count(startOfMonth),
        count(),
      ]);
      return { week, month, total };
    };

    const emptyDail = () => {
      const map = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(startOfToday.getTime() - i * 86_400_000);
        map.set(toKstDateKey(day), 0);
      }
      return map;
    };
    const fillDaily = (
      rows: { createdAt: Date }[],
      buckets: Map<string, number>,
    ) => {
      for (const row of rows) {
        const key = toKstDateKey(row.createdAt);
        if (buckets.has(key)) {
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
      }
    };
    const [
      savedCards,
      savedLyrics,
      recommendations,
      cardRows,
      lyricRows,
      recoRows,
      moodRows,
      artistGroups,
    ] = await Promise.all([
      periodCounts((gte) =>
        this.prisma.savedCard.count({
          where: { userId, ...(gte ? { createdAt: { gte } } : {}) },
        }),
      ),
      periodCounts((gte) =>
        this.prisma.savedLyric.count({
          where: { userId, ...(gte ? { createdAt: { gte } } : {}) },
        }),
      ),
      periodCounts((gte) =>
        this.prisma.recommendation.count({
          where: {
            authorId: userId,
            hidden: false,
            ...(gte ? { createdAt: { gte } } : {}),
          },
        }),
      ),
      this.prisma.savedCard.findMany({
        where: { userId, createdAt: { gte: startOfWeek } },
        select: { createdAt: true },
      }),
      this.prisma.savedLyric.findMany({
        where: { userId, createdAt: { gte: startOfWeek } },
        select: { createdAt: true },
      }),
      this.prisma.recommendation.findMany({
        where: {
          authorId: userId,
          hidden: false,
          createdAt: { gte: startOfWeek },
        },
        select: { createdAt: true },
      }),
      this.prisma.recommendation.findMany({
        where: { authorId: userId, hidden: false },
        select: { moods: true },
      }),
      this.prisma.recommendation.groupBy({
        by: ['artist'],
        where: { authorId: userId, hidden: false },
        _count: { _all: true },
        orderBy: { _count: { artist: 'desc' } },
        take: 8,
      }),
    ]);

    const cardDaily = emptyDail();
    const lyricDaily = emptyDail();
    const recoDaily = emptyDail();
    fillDaily(cardRows, cardDaily);
    fillDaily(lyricRows, lyricDaily);
    fillDaily(recoRows, recoDaily);

    const daily = Array.from(cardDaily.keys()).map((date) => ({
      date,
      savedCards: cardDaily.get(date) ?? 0,
      savedLyrics: lyricDaily.get(date) ?? 0,
      recommendations: recoDaily.get(date) ?? 0,
    }));

    const moodCounts = new Map<string, number>();
    for (const row of moodRows) {
      for (const mood of row.moods) {
        moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1);
      }
    }
    const moods = Array.from(moodCounts.entries())
      .map(([mood, count]) => ({
        mood,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const artists = artistGroups.map((g) => ({
      artist: g.artist,
      count: g._count._all,
    }));
    return {
      period: {
        weekStart: toKstDateKey(startOfWeek),
        monthKey,
      },
      savedCards,
      savedLyrics,
      recommendations,
      daily,
      moods,
      artists,
    };
  }
}
