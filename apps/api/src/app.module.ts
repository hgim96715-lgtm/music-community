import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { FriendsModule } from './friends/friends.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { convert: true },
    }),
    PrismaModule,
    RecommendationsModule,
    AuthModule,
    AdminModule,
    FriendsModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
