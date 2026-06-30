import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const DAILY_STATS_DAYS = 7;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  private toLocalDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toLocalMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private startOfMonth(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
    return start;
  }

  private startOfYear(date: Date): Date {
    const start = this.startOfMonth(date);
    start.setMonth(0);
    return start;
  }

  private buildDailyBuckets(days: number): Map<string, number> {
    const buckets = new Map<string, number>();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    for (let i = 0; i < days; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      buckets.set(this.toLocalDateKey(day), 0);
    }

    return buckets;
  }

  /** 올해 1월 ~ 이번 달 (서버 로컬). 작년·이전 달은 버킷에 넣지 않음 */
  private buildMonthlyBuckets(reference = new Date()): Map<string, number> {
    const buckets = new Map<string, number>();
    const year = reference.getFullYear();
    const endMonth = reference.getMonth();

    for (let month = 0; month <= endMonth; month++) {
      buckets.set(this.toLocalMonthKey(new Date(year, month, 1)), 0);
    }

    return buckets;
  }

  private buildHourlyBuckets(): Map<number, number> {
    const buckets = new Map<number, number>();
    for (let hour = 0; hour < 24; hour++) {
      buckets.set(hour, 0);
    }
    return buckets;
  }

  async getStats() {
    const now = new Date();
    const currentYear = now.getFullYear();

    // 오늘 00:00 — 「오늘」 카운트·DAU 기준 (서버 로컬)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // 최근 7일 창 시작 — 오늘 포함 (오늘 − 6일)
    const startOfDaily = new Date(startOfToday);
    startOfDaily.setDate(startOfDaily.getDate() - (DAILY_STATS_DAYS - 1));

    const startOfMonthly = this.startOfYear(now);

    // inactive7d — lastActiveAt 이 이 시각보다 이전이면 「7일+ 미접속」(null 포함)
    const inactiveSince = new Date(startOfToday);
    inactiveSince.setDate(inactiveSince.getDate() - 7);

    const [
      total,
      hidden,
      today,
      recentDaily,
      recentMonthly,
      recentHourlyToday,
      usersTotal,
      signupsToday,
      recentSignups,
      activeToday,
      recentActive,
      inactive7d,
    ] = await Promise.all([
      // total
      this.prisma.recommendation.count(),
      // hidden — 숨김 추천
      this.prisma.recommendation.count({ where: { hidden: true } }),
      // today — 오늘 작성한 추천 수
      this.prisma.recommendation.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // recentDaily — daily[] 버킷용 (최근 7일 추천 createdAt)
      this.prisma.recommendation.findMany({
        where: { createdAt: { gte: startOfDaily } },
        select: { createdAt: true },
      }),
      // recentMonthly — monthly[] 버킷용 (올해 추천 createdAt)
      this.prisma.recommendation.findMany({
        where: { createdAt: { gte: startOfMonthly } },
        select: { createdAt: true },
      }),
      // recentHourlyToday — hourly[] 버킷용 (오늘 추천만 · 자정 리셋)
      this.prisma.recommendation.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { createdAt: true },
      }),
      // usersTotal — role: user 회원 수
      this.prisma.user.count({ where: { role: 'user' } }),
      // signupsToday — 오늘 가입 수 (createdAt 기준 · 가입일)
      this.prisma.user.count({
        where: { role: 'user', createdAt: { gte: startOfToday } },
      }),
      // recentSignups — signupsDaily[] 버킷용 (최근 7일 가입 createdAt)
      this.prisma.user.findMany({
        where: { role: 'user', createdAt: { gte: startOfDaily } },
        select: { createdAt: true },
      }),
      // activeToday — 오늘 DAU (lastActiveAt >= 오늘 0시 · role: user)
      this.prisma.user.count({
        where: { role: 'user', lastActiveAt: { gte: startOfToday } },
      }),
      // recentActive — activeDaily[] 버킷용 (최근 7일 lastActiveAt)
      this.prisma.user.findMany({
        where: { role: 'user', lastActiveAt: { gte: startOfDaily } },
        select: { lastActiveAt: true },
      }),
      // inactive7d — 7일 이상 미접속
      this.prisma.user.count({
        where: {
          role: 'user',
          OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: inactiveSince } }],
        },
      }),
    ]);

    // signupsDaily[] — 일별 가입 (User.createdAt)
    const signupsDailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS);
    for (const row of recentSignups) {
      const key = this.toLocalDateKey(row.createdAt);
      if (signupsDailyBuckets.has(key)) {
        signupsDailyBuckets.set(key, (signupsDailyBuckets.get(key) ?? 0) + 1);
      }
    }

    const signupsDaily = Array.from(signupsDailyBuckets.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // activeDaily[] — 일별 활동 (User.lastActiveAt 날짜 키 · signupsDaily와 같은 shape)
    const activeDailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS);
    for (const row of recentActive) {
      if (!row.lastActiveAt) continue;
      const key = this.toLocalDateKey(row.lastActiveAt);
      if (activeDailyBuckets.has(key)) {
        activeDailyBuckets.set(key, (activeDailyBuckets.get(key) ?? 0) + 1);
      }
    }

    const activeDaily = Array.from(activeDailyBuckets.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // daily[] — 일별 추천 작성 (Recommendation.createdAt)
    const dailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS);
    for (const row of recentDaily) {
      const key = this.toLocalDateKey(row.createdAt);
      if (dailyBuckets.has(key)) {
        dailyBuckets.set(key, (dailyBuckets.get(key) ?? 0) + 1);
      }
    }

    const monthlyBuckets = this.buildMonthlyBuckets(now);
    for (const row of recentMonthly) {
      if (row.createdAt.getFullYear() !== currentYear) {
        continue;
      }

      const monthKey = this.toLocalMonthKey(row.createdAt);
      if (monthlyBuckets.has(monthKey)) {
        monthlyBuckets.set(monthKey, (monthlyBuckets.get(monthKey) ?? 0) + 1);
      }
    }

    const hourlyBuckets = this.buildHourlyBuckets();
    for (const row of recentHourlyToday) {
      const hour = row.createdAt.getHours();
      hourlyBuckets.set(hour, (hourlyBuckets.get(hour) ?? 0) + 1);
    }

    const daily = Array.from(dailyBuckets.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    const monthly = Array.from(monthlyBuckets.entries()).map(
      ([month, count]) => ({
        month,
        count,
      }),
    );

    const hourly = Array.from(hourlyBuckets.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));

    return {
      total,
      hidden,
      visible: total - hidden,
      today,
      daily,
      monthly,
      hourly,
      usersTotal,
      signupsToday,
      signupsDaily,
      activeToday,
      activeDaily,
      inactive7d,
    };
  }
}
