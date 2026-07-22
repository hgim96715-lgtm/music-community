import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

/** 탈퇴 유예 중에도 허용 (취소·조회 등) */
export const ALLOW_WITHDRAWING_KEY = 'allowWithdrawing';
export const AllowWithdrawing = () => SetMetadata(ALLOW_WITHDRAWING_KEY, true);

/**
 * JWT 다음 — deletedAt 있으면 쓰기 API 403
 * 사용: @UseGuards(JwtAuthGuard, ActiveAccountGuard)
 * 예외: @AllowWithdrawing()  (withdraw/cancel · GET me)
 */
@Injectable()
export class ActiveAccountGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allow = this.reflector.getAllAndOverride<boolean>(
      ALLOW_WITHDRAWING_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allow) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.sub;
    if (!userId) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });

    if (user?.deletedAt) {
      throw new ForbiddenException(
        '탈퇴 예정 계정입니다. 설정에서 탈퇴를 취소한 뒤 이용할 수 있어요.',
      );
    }

    return true;
  }
}
