import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { EnvKeys } from 'src/config/env.keys';

export type GoogleOAuthProfile = {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const port = configService.getOrThrow<string>(EnvKeys.PORT);
    super({
      clientID: configService.getOrThrow<string>(EnvKeys.GOOGLE_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(
        EnvKeys.GOOGLE_CLIENT_SECRET,
      ),
      callbackURL: `http://localhost:${port}/auth/oauth/google/callback`,
      scope: ['email', 'profile'],
    });
  }
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleOAuthProfile {
    const email = profile.emails?.[0]?.value ?? null;
    const emailVerified = profile.emails?.[0]?.verified ?? false;
    return {
      providerAccountId: profile.id,
      email,
      emailVerified,
      displayName: profile.displayName ?? null,
    };
  }
}
