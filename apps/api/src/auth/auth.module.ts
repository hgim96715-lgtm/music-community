import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EnvKeys } from 'src/config/env.keys';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(EnvKeys.API_JWT_SECRET),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard, AuthService],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
