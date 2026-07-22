import { Module } from '@nestjs/common';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AuthModule } from 'src/auth/auth.module';
import { AdminRecommendationsService } from './admin-recommendations.service';
import { AdminRecommendationsController } from './admin-recommendations.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [
    AdminStatsController,
    AdminRecommendationsController,
    AdminUsersController,
  ],
  providers: [
    AdminStatsService,
    AdminRecommendationsService,
    AdminUsersService,
  ],
})
export class AdminModule {}
