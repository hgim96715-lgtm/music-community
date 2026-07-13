import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-kakao';
import { EnvKeys } from 'src/config/env.keys';
import { OAuthProvider } from 'src/generated/prisma/client';
import type { OAuthProfile } from './oauth-profile';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>(EnvKeys.KAKAO_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(
        EnvKeys.KAKAO_CLIENT_SECRET,
      ),
      callbackURL: configService.getOrThrow<string>(EnvKeys.KAKAO_CALLBACK_URL),
      //   scope: ['profile_nickname', 'account_email'],
    });
  }
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): OAuthProfile {
    const account = profile._json?.kakao_account;
    const email = account?.email ?? null;
    return {
      provider: OAuthProvider.kakao,
      providerAccountId: String(profile.id),
      email,
      emailVerified: Boolean(email),
      displayName:
        profile.username || profile._json?.properties?.nickname || '',
    };
  }
}
