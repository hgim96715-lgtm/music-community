import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { UserRole } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

const adminUserInclude = {
  _count: {
    select: {
      recommendations: true,
      reactions: true,
      savedCards: true,
    },
  },
} as const;

const adminUserSelect = {
  id: true,
  email: true,
  nickname: true,
  role: true,
  createdAt: true,
  lastActiveAt: true,
} as const;

// 관리자 사용자 이메일 , 닉네임 검색 필터링
export type AdminUserListQuery = {
  q?: string;
  role?: UserRole;
  inactiveDays?: number;
  activeToday?: boolean;
};

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: AdminUserListQuery = {}) {
    const where: Prisma.UserWhereInput = {};
    if (query.q?.trim()) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { nickname: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.role) {
      where.role = query.role;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (query.activeToday) {
      where.lastActiveAt = { gte: startOfToday };
    } else if (query.inactiveDays != null && query.inactiveDays > 0) {
      const inactiveSince = new Date(startOfToday);
      inactiveSince.setDate(inactiveSince.getDate() - query.inactiveDays);

      const inactiveFilter: Prisma.UserWhereInput = {
        OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: inactiveSince } }],
      };
      const existingAnd = where.AND
        ? Array.isArray(where.AND)
          ? where.AND
          : [where.AND]
        : [];
      where.AND = [...existingAnd, inactiveFilter];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        ...adminUserSelect,
        _count: adminUserInclude._count,
      },
    });
  }
}
