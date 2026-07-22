import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UsersWithdrawCron } from './users-withdraw.cron';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UsersWithdrawCron],
  exports: [UsersService],
})
export class UsersModule {}
