import { Get, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAdminRecommendationDto } from './dto/update-admin-recommendation.dto';

@Injectable()
export class AdminRecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.recommendation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { reactions: true },
    });
  }

  async update(id: string, dto: UpdateAdminRecommendationDto) {
    try {
      return await this.prisma.recommendation.update({
        where: { id },
        data: {
          ...(dto.hidden !== undefined && { hidden: dto.hidden }),
        },
        include: { reactions: true },
      });
    } catch {
      throw new NotFoundException(`추천 글을 찾을 수 없습니다. id=${id}`);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.recommendation.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`추천 글을 찾을 수 없습니다. id=${id}`);
    }
  }
}
