import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { ReportStatus, ReportTargetType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListAdminReportsQueryDto } from './dto/list-admin-reports-query.dto';
import { UpdateAdminReportDto } from './dto/update-admin-report.dto';

type TargetSnippet =
  | {
      kind: 'recommendation';
      title: string;
      artist: string;
      reason: string;
      hidden: boolean;
      author: { id: string; nickname: string };
    }
  | {
      kind: 'comment';
      body: string;
      recommendationId: string;
      recommendationTitle: string | null;
      author: { id: string; nickname: string };
    }
  | {
      kind: 'room_message';
      body: string | null;
      roomId: string;
      roomName: string | null;
      deletedAt: string | null;
      sender: { id: string; nickname: string };
    };

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadTargets(
    rows: { targetType: ReportTargetType; targetId: string }[],
  ) {
    const map = new Map<string, TargetSnippet>();
    if (rows.length === 0) return map;

    const recIds = [
      ...new Set(
        rows
          .filter((row) => row.targetType === ReportTargetType.recommendation)
          .map((row) => row.targetId),
      ),
    ];
    const commentIds = [
      ...new Set(
        rows
          .filter((row) => row.targetType === ReportTargetType.comment)
          .map((row) => row.targetId),
      ),
    ];

    const messageIds = [
      ...new Set(
        rows
          .filter((row) => row.targetType === ReportTargetType.room_message)
          .map((row) => row.targetId),
      ),
    ];
    const [recs, comments, messages] = await Promise.all([
      recIds.length
        ? this.prisma.recommendation.findMany({
            where: { id: { in: recIds } },
            select: {
              id: true,
              title: true,
              artist: true,
              reason: true,
              hidden: true,
              author: { select: { id: true, nickname: true } },
            },
          })
        : Promise.resolve([]),
      commentIds.length
        ? this.prisma.comment.findMany({
            where: { id: { in: commentIds } },
            select: {
              id: true,
              body: true,
              recommendationId: true,
              author: { select: { id: true, nickname: true } },
              recommendation: { select: { title: true } },
            },
          })
        : Promise.resolve([]),
      messageIds.length
        ? this.prisma.roomMessage.findMany({
            where: { id: { in: messageIds } },
            select: {
              id: true,
              body: true,
              roomId: true,
              deletedAt: true,
              sender: { select: { id: true, nickname: true } },
              room: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    for (const row of recs) {
      map.set(`${ReportTargetType.recommendation}:${row.id}`, {
        kind: 'recommendation',
        title: row.title,
        artist: row.artist,
        reason: row.reason,
        hidden: row.hidden,
        author: row.author,
      });
    }
    for (const row of comments) {
      map.set(`${ReportTargetType.comment}:${row.id}`, {
        kind: 'comment',
        body: row.body,
        recommendationId: row.recommendationId,
        recommendationTitle: row.recommendation.title,
        author: row.author,
      });
    }
    for (const row of messages) {
      map.set(`${ReportTargetType.room_message}:${row.id}`, {
        kind: 'room_message',
        body: row.body,
        roomId: row.roomId,
        roomName: row.room.name,
        deletedAt: row.deletedAt?.toISOString() ?? null,
        sender: row.sender,
      });
    }
    return map;
  }

  async list(query: ListAdminReportsQueryDto) {
    const take = Math.min(Math.max(query.limit ?? 30, 1), 50);
    const where: Prisma.ReportWhereInput = {};

    if (query.status) where.status = query.status as ReportStatus;
    if (query.targetType) {
      where.targetType = query.targetType as ReportTargetType;
    }

    const rows = await this.prisma.report.findMany({
      where,
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        reporter: {
          select: { id: true, nickname: true, email: true },
        },
      },
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const targets = await this.loadTargets(page);
    return {
      items: page.map((row) => {
        const target = targets.get(`${row.targetType}:${row.targetId}`);
        return {
          id: row.id,
          targetType: row.targetType,
          targetId: row.targetId,
          reason: row.reason,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          reporter: row.reporter,
          target,
          targetMissing: target == null,
        };
      }),
      nextcursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }

  async update(id: string, dto: UpdateAdminReportDto) {
    const row = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true, status: true, targetType: true, targetId: true },
    });
    if (!row) throw new NotFoundException('신고를 찾을 수 없습니다.');
    if (row.status !== ReportStatus.pending)
      throw new ConflictException('이미 처리된 신고입니다.');
    const status = dto.status as ReportStatus;
    const [, updated] = await this.prisma.$transaction([
      this.prisma.report.updateMany({
        where: {
          targetType: row.targetType,
          targetId: row.targetId,
          status: ReportStatus.pending,
          NOT: { id: row.id },
        },
        data: { status },
      }),
      this.prisma.report.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          reporter: {
            select: { id: true, nickname: true, email: true },
          },
        },
      }),
    ]);
    return {
      id: updated.id,
      targetType: updated.targetType,
      targetId: updated.targetId,
      reason: updated.reason,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      reporter: updated.reporter,
    };
  }
}
