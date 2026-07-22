import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminNoticeDto } from './dto/create-admin-notice.dto';
import { UpdateAdminNoticeDto } from './dto/update-admin-notice.dto';

const noticeInclude = {
  author: { select: { id: true, nickname: true } },
} as const;

@Injectable()
export class AdminNoticesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.notice.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: noticeInclude,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.notice.findUnique({
      where: { id },
      include: noticeInclude,
    });
    if (!row) {
      throw new NotFoundException('공지가 존재하지 않습니다.');
    }
    return row;
  }

  create(authorId: string, dto: CreateAdminNoticeDto) {
    const published = dto.published ?? false;
    return this.prisma.notice.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        published,
        publishedAt: published ? new Date() : null,
        authorId,
      },
      include: noticeInclude,
    });
  }

  async update(id: string, dto: UpdateAdminNoticeDto) {
    const row = await this.findOne(id);
    const published = dto.published ?? row.published;
    let publishedAt = row.publishedAt;
    if (dto.published === true && !row.published) {
      publishedAt = new Date();
    } else if (dto.published === false && row.published) {
      publishedAt = null;
    }
    return this.prisma.notice.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        body: dto.body?.trim(),
        published,
        publishedAt,
      },
      include: noticeInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notice.delete({ where: { id } });
  }
}
