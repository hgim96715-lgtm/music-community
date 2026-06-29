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

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfDaily = new Date(startOfToday);
    startOfDaily.setDate(startOfDaily.getDate() - (DAILY_STATS_DAYS - 1));

    const startOfMonthly = this.startOfYear(now);

    const [total, hidden, today, recentDaily, recentMonthly] =
      await Promise.all([
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
      ]);

    const dailyBuckets = this.buildDailyBuckets(DAILY_STATS_DAYS);
    for (const row of recentDaily) {
      const key = this.toLocalDateKey(row.createdAt);
      if (dailyBuckets.has(key)) {
        dailyBuckets.set(key, (dailyBuckets.get(key) ?? 0) + 1);
      }
    }

    const monthlyBuckets = this.buildMonthlyBuckets(now);
    const hourlyBuckets = this.buildHourlyBuckets();
    for (const row of recentMonthly) {
      if (row.createdAt.getFullYear() !== currentYear) {
        continue;
      }

      const monthKey = this.toLocalMonthKey(row.createdAt);
      if (monthlyBuckets.has(monthKey)) {
        monthlyBuckets.set(monthKey, (monthlyBuckets.get(monthKey) ?? 0) + 1);
      }

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
    };
  }
}
