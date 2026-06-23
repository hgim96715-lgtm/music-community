import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.recommendation.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      include: {
        reactions: true,
        author: { select: { id: true, nickname: true, image: true } },
      },
    });
  }

  create(dto: CreateRecommendationDto, authorId: string) {
    const { title, artist, embedUrl, reason, moods } = dto;
    return this.prisma.recommendation.create({
      data: {
        title,
        artist,
        embedUrl,
        reason,
        moods,
        authorId,
      },
      include: {
        reactions: true,
        author: { select: { id: true, nickname: true, image: true } },
      },
    });
  }
  async createReaction(recommendationId: string, userId: string) {
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, hidden: false },
    });
    if (!recommendation) {
      throw new NotFoundException(
        `추천 글을 찾을 수 없습니다. id=${recommendationId}`,
      );
    }
    const existingReaction = await this.prisma.reaction.findUnique({
      where: { userId_recommendationId: { userId, recommendationId } },
    });

    if (existingReaction) {
      await this.prisma.reaction.delete({ where: { id: existingReaction.id } });
    } else {
      await this.prisma.reaction.create({
        data: { recommendationId, userId, type: 'like' },
      });
    }
    const likeCount = await this.prisma.reaction.count({
      where: { recommendationId, type: 'like' },
    });
    return { liked: !existingReaction, likeCount };
  }
}
