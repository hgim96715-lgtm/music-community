import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
    return userId;
  },
);
