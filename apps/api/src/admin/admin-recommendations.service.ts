import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAdminRecommendationDto } from './dto/update-admin-recommendation.dto';

const adminRecommendationInclude = {
  author: { select: { id: true, nickname: true } },
  reactions: true,
  _count: { select: { savedCards: true } },
} as const;

@Injectable()
export class AdminRecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.recommendation.findMany({
      orderBy: { createdAt: 'desc' },
      include: adminRecommendationInclude,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.recommendation.findUnique({
      where: { id },
      include: adminRecommendationInclude,
    });
    if (!row) {
      throw new NotFoundException('추천을 찾을 수 없어요.');
    }
    return row;
  }

  async update(id: string, dto: UpdateAdminRecommendationDto) {
    await this.findOne(id);
    return this.prisma.recommendation.update({
      where: { id },
      data: { hidden: dto.hidden },
      include: adminRecommendationInclude,
    });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.recommendation.delete({ where: { id } });
  }
}
