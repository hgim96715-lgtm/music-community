import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-naver-v2';
import { EnvKeys } from 'src/config/env.keys';
import { OAuthProvider } from 'src/generated/prisma/enums';
import type { OAuthProfile } from './oauth-profile';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow(EnvKeys.NAVER_CLIENT_ID),
      clientSecret: configService.getOrThrow(EnvKeys.NAVER_CLIENT_SECRET),
      callbackURL: configService.getOrThrow<string>(EnvKeys.NAVER_CALLBACK_URL),
    });
  }
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): OAuthProfile {
    return {
      provider: OAuthProvider.naver,
      providerAccountId: profile.id,
      email: profile.email ?? null,
      emailVerified: Boolean(profile.email),
      displayName: profile.nickname ?? profile.name ?? '',
    };
  }
}
