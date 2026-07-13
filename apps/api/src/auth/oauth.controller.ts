import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import passport from 'passport';
import { AuthService } from './auth.service';
import type { OAuthProfile } from './oauth-profile';

const DEFAULT_NEXT = '/recommendations';

function sanitizeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return DEFAULT_NEXT;
  }
  return path;
}

@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  googleStart(
    @Query('next') next: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    req.session.oauthNext = sanitizeRedirectPath(next);
    return passport.authenticate('google')(req, res);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const next = sanitizeRedirectPath(req.session.oauthNext);
    delete req.session.oauthNext;
    const redirectUrl = await this.authService.handleOAuthCallback(
      req.user as unknown as OAuthProfile,
      next,
    );
    return res.redirect(redirectUrl);
  }

  @Get('naver')
  naverStart(
    @Query('next') next: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    req.session.oauthNext = sanitizeRedirectPath(next);
    return passport.authenticate('naver')(req, res);
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    const next = sanitizeRedirectPath(req.session.oauthNext);
    delete req.session.oauthNext;
    const redirectUrl = await this.authService.handleOAuthCallback(
      req.user as unknown as OAuthProfile,
      next,
    );
    return res.redirect(redirectUrl);
  }

  @Get('kakao')
  kakaoStart(
    @Query('next') next: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    req.session.oauthNext = sanitizeRedirectPath(next);
    return passport.authenticate('kakao')(req, res);
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: Request, @Res() res: Response) {
    const next = sanitizeRedirectPath(req.session.oauthNext);
    delete req.session.oauthNext;
    const redirectUrl = await this.authService.handleOAuthCallback(
      req.user as unknown as OAuthProfile,
      next,
    );
    return res.redirect(redirectUrl);
  }
}
