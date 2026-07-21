import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SavedCardsModule } from './saved-cards/saved-cards.module';
import { AdminModule } from './admin/admin.module';
import { FriendsModule } from './friends/friends.module';
import { RoomsModule } from './rooms/rooms.module';
import { SavedLyricsModule } from './saved-lyrics/saved-lyrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: { convert: true },
    }),
    PrismaModule,
    RecommendationsModule,
    AuthModule,
    UsersModule,
    SavedCardsModule,
    AdminModule,
    FriendsModule,
    RoomsModule,
    SavedLyricsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
