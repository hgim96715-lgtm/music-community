import { Module } from '@nestjs/common';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AuthModule } from 'src/auth/auth.module';
import { AdminRecommendationsService } from './admin-recommendations.service';
import { AdminRecommendationsController } from './admin-recommendations.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { UsersModule } from 'src/users/users.module';
import { AdminNoticesService } from './admin-notices.service';
import { AdminNoticesController } from './admin-notices.controller';
import { AdminRoomsController } from './admin-rooms.controller';
import { AdminRoomsService } from './admin-rooms.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [
    AdminStatsController,
    AdminRecommendationsController,
    AdminUsersController,
    AdminNoticesController,
    AdminRoomsController,
  ],
  providers: [
    AdminStatsService,
    AdminRecommendationsService,
    AdminUsersService,
    AdminNoticesService,
    AdminRoomsService,
  ],
})
export class AdminModule {}
