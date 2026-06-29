import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSavedCardDto } from './dto/create-saved-card.dto';
import { UpdateSavedCardDto } from './dto/update-saved-card.dto';

const savedCardInclude = {
  recommendation: {
    select: {
      id: true,
      title: true,
      artist: true,
      embedUrl: true,
      moods: true,
      reason: true,
      createdAt: true,
    },
  },
} as const;

@Injectable()
export class SavedCardsService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.savedCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: savedCardInclude,
    });
  }

  async create(userId: string, dto: CreateSavedCardDto) {
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: dto.recommendationId, hidden: false },
      select: { id: true, authorId: true },
    });
    if (!recommendation) {
      throw new NotFoundException('추천을 찾을 수 없어요.');
    }
    if (recommendation.authorId !== userId) {
      throw new ForbiddenException('본인 글만 저장할 수 있어요.');
    }
    const existing = await this.prisma.savedCard.findFirst({
      where: { userId, recommendationId: dto.recommendationId },
    });

    if (existing) {
      throw new ConflictException('이미 저장한 추천이에요.');
    }
    return this.prisma.savedCard.create({
      data: {
        userId,
        recommendationId: dto.recommendationId,
        customization: dto.customization,
      },
      include: savedCardInclude,
    });
  }
  async update(
    userId: string,
    savedCardId: string,
    dto: UpdateSavedCardDto,
  ) {
    const card = await this.prisma.savedCard.findUnique({
      where: { id: savedCardId },
      select: { id: true, userId: true },
    });
    if (!card) {
      throw new NotFoundException('저장한 카드를 찾을 수 없어요.');
    }
    if (card.userId !== userId) {
      throw new ForbiddenException('본인 카드만 수정할 수 있어요.');
    }
    return this.prisma.savedCard.update({
      where: { id: savedCardId },
      data: { customization: dto.customization },
      include: savedCardInclude,
    });
  }

  async delete(userId: string, savedCardId: string) {
    const card = await this.prisma.savedCard.findUnique({
      where: { id: savedCardId },
      select: { id: true, userId: true },
    });
    if (!card) {
      throw new NotFoundException('저장한 카드를 찾을 수 없어요.');
    }
    if (card.userId !== userId) {
      throw new ForbiddenException('본인 카드만 삭제할 수 있어요.');
    }
    await this.prisma.savedCard.delete({
      where: { id: savedCardId },
    });
  }
}
