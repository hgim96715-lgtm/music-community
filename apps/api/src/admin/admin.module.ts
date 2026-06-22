import { Module } from '@nestjs/common';
import { AdminRecommendationsController } from './admin-recommendations.controller';
import { AdminRecommendationsService } from './admin-recommendations.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminRecommendationsController, AdminStatsController],
  providers: [AdminRecommendationsService, AdminStatsService],
})
export class AdminModule {}
