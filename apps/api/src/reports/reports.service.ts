import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, ReportTargetType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async createReport(opts: {
    targetType: ReportTargetType;
    targetId: string;
    reporterId: string;
    reason: string;
    targetAuthorId: string;
  }) {
    if (opts.reporterId === opts.targetAuthorId)
      throw new ConflictException('자신을 신고할 수 없습니다.');

    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId: opts.reporterId,
        targetType: opts.targetType,
        targetId: opts.targetId,
      },
      select: { id: true },
    });

    if (existing) throw new ConflictException('이미 신고한 내역이 있습니다.');

    const row = await this.prisma.report.create({
      data: {
        targetType: opts.targetType,
        targetId: opts.targetId,
        reporterId: opts.reporterId,
        reason: opts.reason.trim(),
      },
    });
    return {
      id: row.id,
      targetType: opts.targetType,
      targetId: opts.targetId,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createCommentReport(
    commentId: string,
    reporterId: string,
    reason: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    return this.createReport({
      targetType: ReportTargetType.comment,
      targetId: commentId,
      reporterId,
      reason,
      targetAuthorId: comment.authorId,
    });
  }

  async createRoomMessageReport(
    messageId: string,
    reporterId: string,
    reason: string,
  ) {
    const message = await this.prisma.roomMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, deletedAt: true },
    });
    if (!message || message.deletedAt)
      throw new NotFoundException('메시지를 찾을 수 없습니다.');

    return this.createReport({
      targetType: ReportTargetType.room_message,
      targetId: message.id,
      reporterId,
      reason,
      targetAuthorId: message.senderId,
    });
  }

  async createRecommendationReport(
    recommendationId: string,
    reporterId: string,
    reason: string,
  ) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id: recommendationId },
      select: { id: true, authorId: true },
    });
    if (!recommendation)
      throw new NotFoundException('추천글을 찾을 수 없습니다.');

    return this.createReport({
      targetType: ReportTargetType.recommendation,
      targetId: recommendationId,
      reporterId,
      reason,
      targetAuthorId: recommendation.authorId,
    });
  }
}
