import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSavedLyricDto } from './dto/create-saved-lyric.dto';
import { UpdateSavedLyricDto } from './dto/update-saved-lyric.dto';

const savedLyricInclude = {
  recommendation: {
    select: {
      id: true,
      title: true,
      artist: true,
      embedUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

@Injectable()
export class SavedLyricsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(userId: string, id: string) {
    const row = await this.prisma.savedLyric.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!row) throw new NotFoundException('가사를 찾을 수 없어요.');
    if (row.userId !== userId)
      throw new ForbiddenException('본인 가사만 수정할 수 있어요.');
  }

  findMine(userId: string) {
    return this.prisma.savedLyric.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: savedLyricInclude,
    });
  }
  async create(userId: string, dto: CreateSavedLyricDto) {
    const lyricsText = dto.lyricsText.trim();
    if (!lyricsText) {
      throw new BadRequestException('가사를 입력해 주세요.');
    }
    const start = dto.startSec;
    const end = dto.endSec;
    if (start !== undefined && end !== undefined && end < start) {
      throw new BadRequestException('끝 시각은 시작 시각 이후여야 해요.');
    }
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: dto.recommendationId, hidden: false },
      select: { id: true },
    });
    if (!recommendation) {
      throw new NotFoundException('추천 곡을 찾을 수 없어요.');
    }
    return this.prisma.savedLyric.create({
      data: {
        userId,
        recommendationId: dto.recommendationId,
        lyricsText,
        note: dto.note?.trim() || null,
        startSec: start,
        endSec: end,
      },
      include: savedLyricInclude,
    });
  }

  async update(userId: string, id: string, dto: UpdateSavedLyricDto) {
    await this.assertOwner(userId, id);
    if (
      dto.startSec !== undefined &&
      dto.endSec !== undefined &&
      dto.startSec !== null &&
      dto.endSec !== null &&
      dto.endSec < dto.startSec
    ) {
      throw new BadRequestException('끝 시각은 시작 시각 이후여야 해요.');
    }
    const data: {
      lyricsText?: string;
      note?: string | null;
      startSec?: number | null;
      endSec?: number | null;
    } = {};
    if (dto.lyricsText !== undefined) {
      const t = dto.lyricsText.trim();
      if (!t) throw new BadRequestException('가사를 입력해 주세요.');
      data.lyricsText = t;
    }
    if (dto.note !== undefined) {
      data.note = dto.note === null ? null : dto.note.trim() || null;
    }
    if (dto.startSec !== undefined) data.startSec = dto.startSec;
    if (dto.endSec !== undefined) data.endSec = dto.endSec;
    return this.prisma.savedLyric.update({
      where: { id },
      data,
      include: savedLyricInclude,
    });
  }
  async delete(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.savedLyric.delete({ where: { id } });
  }
}
