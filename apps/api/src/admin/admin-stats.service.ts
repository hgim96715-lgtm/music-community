import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, hidden, today] = await Promise.all([
      this.prisma.recommendation.count(),
      this.prisma.recommendation.count({ where: { hidden: true } }),
      this.prisma.recommendation.count({
        where: { createdAt: { gte: startOfToday } },
      }),
    ]);

    return {
      total,
      hidden,
      visible: total - hidden,
      today,
    };
  }
}
