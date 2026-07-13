import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EnvKeys } from 'src/config/env.keys';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { OAuthController } from './oauth.controller';
import { NaverStrategy } from './naver.strategy';
import { KakaoStrategy } from './kakao.strategy';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(EnvKeys.API_JWT_SECRET),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    AuthService,
    GoogleStrategy,
    NaverStrategy,
    KakaoStrategy,
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, AuthService],
  controllers: [AuthController, OAuthController],
})
export class AuthModule {}
