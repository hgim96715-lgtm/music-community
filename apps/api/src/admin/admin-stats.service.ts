import { Injectable } from '@nestjs/common';
import {
  getKstHour,
  getKstMonthKey,
  getKstYear,
  startOfKstDay,
  toKstDateKey,
} from 'src/common/kst-date';
import { PrismaService } from 'src/prisma/prisma.service';

const DAILY_STATS_DAYS = 7;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfKstYear(reference = new Date()): Date {
    return new Date(`${getKstYear(reference)}-01-01T00:00:00+09:00`);
  }

  private buildDailyBuckets(days: number, reference = new Date()): Map<string, number> {
    const buckets = new Map<string, number>();
    const anchor = startOfKstDay(reference);

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(anchor.getTime() - i * MS_PER_DAY);
      buckets.set(toKstDateKey(day), 0);
    }

    return buckets;
  }

  /** KST 올해 1월 ~ 이번 달 */
  private buildMonthlyBuckets(reference = new Date()): Map<string, number> {
    const buckets = new Map<string, number>();
    const year = getKstYear(reference);
    const endMonth = Number(toKstDateKey(reference).slice(5, 7));

    for (let month = 1; month <= endMonth; month++) {
      buckets.set(`${year}-${String(month).padStart(2, '0')}`, 0);
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
    const currentYear = getKstYear(now);
    const startOfToday = startOfKstDay(now);
    const startOfDaily = new Date(
      startOfToday.getTime() - (DAILY_STATS_DAYS - 1) * MS_PER_DAY,
    );
    const startOfMonthly = this.startOfKstYear(now);
    const inactiveSince = new Date(startOfToday.getTime() - 7 * MS_PER_DAY);

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
      this.prisma.recommendation.count(),
      this.prisma.recommendation.count({ where: { hidden: true } }),
      this.prisma.recommendation.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.recommendation.findMany({
        where: { createdAt: { gte: startOfDaily } },
        select: { createdAt: true },
      }),
      this.prisma.recommendation.findMany({
        where: { createdAt: { gte: startOfMonthly } },
        select: { createdAt: true },
      }),
      this.prisma.recommendation.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { createdAt: true },
      }),
      this.prisma.user.count({ where: { role: 'user' } }),
      this.prisma.user.count({
        where: { role: 'user', createdAt: { gte: startOfToday } },
      }),
      this.prisma.user.findMany({
        where: { role: 'user', createdAt: { gte: startOfDaily } },
        select: { createdAt: true },
      }),
      this.prisma.user.count({
        where: { role: 'user', lastActiveAt: { gte: startOfToday } },
      }),
      this.prisma.user.findMany({
        where: { role: 'user', lastActiveAt: { gte: startOfDaily } },
        select: { lastActiveAt: true },
      }),
      this.prisma.user.count({
        where: {
          role: 'user',
          OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: inactiveSince } }],
        },
      }),
    ]);

    const signupsDailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS, now);
    for (const row of recentSignups) {
      const key = toKstDateKey(row.createdAt);
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

    const activeDailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS, now);
    for (const row of recentActive) {
      if (!row.lastActiveAt) continue;
      const key = toKstDateKey(row.lastActiveAt);
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

    const dailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS, now);
    for (const row of recentDaily) {
      const key = toKstDateKey(row.createdAt);
      if (dailyBuckets.has(key)) {
        dailyBuckets.set(key, (dailyBuckets.get(key) ?? 0) + 1);
      }
    }

    const monthlyBuckets = this.buildMonthlyBuckets(now);
    for (const row of recentMonthly) {
      if (getKstYear(row.createdAt) !== currentYear) {
        continue;
      }

      const monthKey = getKstMonthKey(row.createdAt);
      if (monthlyBuckets.has(monthKey)) {
        monthlyBuckets.set(monthKey, (monthlyBuckets.get(monthKey) ?? 0) + 1);
      }
    }

    const hourlyBuckets = this.buildHourlyBuckets();
    for (const row of recentHourlyToday) {
      const hour = getKstHour(row.createdAt);
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
