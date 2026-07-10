import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import passport from 'passport';
import { EnvKeys } from 'src/config/env.keys';
import { AuthService } from './auth.service';
import { GoogleOAuthProfile } from './google.strategy';

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

    const redirectUrl = await this.authService.handleGoogleCallback(
      req.user as GoogleOAuthProfile,
      next,
    );
    return res.redirect(redirectUrl);
  }
}
