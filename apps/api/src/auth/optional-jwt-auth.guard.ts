import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { EnvKeys } from 'src/config/env.keys';
import type { JwtPayload } from './jwt-payload';
import { AuthService } from './auth.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) return true;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow(EnvKeys.API_JWT_SECRET),
      });
      request.user = payload;
      this.authService.touchLastActiveAtFromGuard(payload.sub, payload.role);
    } catch {
      // 잘못된 토큰 = 게스트. feed=friends 401은 service
    }
    return true;
  }
}
