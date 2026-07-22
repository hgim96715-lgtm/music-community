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
      select: { id: true, authorId: true },
    });
    if (!recommendation) {
      throw new NotFoundException('추천을 찾을 수 없어요.');
    }
    return recommendation;
  }
  private async assertNotBlocked(a: string, b: string) {
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { id: true },
    });
    if (blocked) {
      throw new ForbiddenException(
        '차단된 사용자와는 댓글을 남길 수 없습니다.',
      );
    }
  }

  findAll() {
    return this.prisma.recommendation.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      include: {
        reactions: true,
        author: true,
        _count: { select: { comments: true } },
      },
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
    const recommendation = await this.assertVisibleRecommendation(recommendationId);
    if (recommendation.authorId === userId) {
      throw new BadRequestException('본인 추천에는 좋아요를 남길 수 없어요.');
    }
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
  async updateComment(
    recommendationId: string,
    commentId: string,
    userId: string,
    body: string,
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, recommendationId },
      select: { id: true, authorId: true },
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없어요.');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('본인 댓글만 수정할 수 있습니다.');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { body },
      include: { author: { select: { id: true, nickname: true } } },
    });
  }

  async createComment(
    recommendationId: string,
    authorId: string,
    body: string,
  ) {
    const recommendation =
      await this.assertVisibleRecommendation(recommendationId);
    if (recommendation.authorId !== authorId) {
      await this.assertNotBlocked(authorId, recommendation.authorId);
    }
    return this.prisma.comment.create({
      data: { recommendationId, authorId, body },
      include: { author: { select: { id: true, nickname: true } } },
    });
  }

  // 본인·admin 삭제 — where에 authorId 넣으면 admin 경로가 막혀서 find 후 권한 검사
  async removeComment(
    recommendationId: string,
    commentId: string,
    userId: string,
  ) {
    await this.assertVisibleRecommendation(recommendationId);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, recommendationId },
      select: { id: true, authorId: true },
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없어요.');
    }
    if (comment.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== 'admin') {
        throw new ForbiddenException('본인 댓글만 삭제할 수 있습니다.');
      }
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
