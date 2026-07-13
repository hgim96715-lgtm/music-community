import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { EnvKeys } from 'src/config/env.keys';
import { OAuthProvider } from 'src/generated/prisma/client';
import type { OAuthProfile } from './oauth-profile';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>(EnvKeys.GOOGLE_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(
        EnvKeys.GOOGLE_CLIENT_SECRET,
      ),
      callbackURL: configService.getOrThrow<string>(
        EnvKeys.GOOGLE_CALLBACK_URL,
      ),
      scope: ['email', 'profile'],
    });
  }
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): OAuthProfile {
    const email = profile.emails?.[0]?.value ?? null;
    const emailVerified = profile.emails?.[0]?.verified ?? false;
    return {
      provider: OAuthProvider.google,
      providerAccountId: profile.id,
      email,
      emailVerified,
      displayName: profile.displayName ?? null,
    };
  }
}
