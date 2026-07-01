import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { normalizeEmbedUrl } from './normalize-embed-url';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertVisibleRecommendation(recommendationId: string) {
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, hidden: false },
      select: { id: true },
    });
    if (!recommendation) {
      throw new NotFoundException('추천을 찾을 수 없어요.');
    }
    return recommendation;
  }

  findAll() {
    return this.prisma.recommendation.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      include: { reactions: true, author: true },
    });
  }

  create(dto: CreateRecommendationDto, authorId: string) {
    const { title, artist, embedUrl, reason, moods } = dto;
    const normalizedEmbedUrl = normalizeEmbedUrl(embedUrl);
    return this.prisma.recommendation.create({
      data: {
        title,
        artist,
        embedUrl: normalizedEmbedUrl,
        reason,
        moods,
        authorId,
      },
      include: { reactions: true, author: true },
    });
  }

  async remove(recommendationId: string, userId: string) {
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, hidden: false },
      select: { id: true, authorId: true },
    });

    if (!recommendation) {
      throw new NotFoundException('추천을 찾을 수 없어요.');
    }
    if (recommendation.authorId !== userId) {
      throw new ForbiddenException('본인 글만 삭제할 수 있습니다.');
    }
    await this.prisma.recommendation.delete({
      where: { id: recommendationId },
    });
  }

  async addLike(recommendationId: string, userId: string) {
    await this.assertVisibleRecommendation(recommendationId);
    const existing = await this.prisma.reaction.findUnique({
      where: { recommendationId_userId: { recommendationId, userId } },
    });
    if (existing) {
      throw new BadRequestException('이미 좋아요한 추천이에요.');
    }
    await this.prisma.reaction.create({
      data: { recommendationId, userId, type: 'like' },
    });
    return { liked: true };
  }

  async removeLike(recommendationId: string, userId: string) {
    await this.assertVisibleRecommendation(recommendationId);
    const existing = await this.prisma.reaction.findUnique({
      where: { recommendationId_userId: { recommendationId, userId } },
    });
    if (!existing) {
      throw new NotFoundException('좋아요한 추천이 아니에요.');
    }
    await this.prisma.reaction.delete({ where: { id: existing.id } });
  }

  // Comment
  async findComments(recommendationId: string) {
    return this.prisma.comment.findMany({
      where: { recommendationId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true } },
      },
    });
  }
}
