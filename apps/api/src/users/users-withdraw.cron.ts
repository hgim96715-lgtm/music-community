import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class UsersWithdrawCron {
  private readonly logger = new Logger(UsersWithdrawCron.name);
  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { timeZone: 'Asia/Seoul' })
  async finalizeExpiredWithdrawals() {
    const result = await this.usersService.finalizeExpiredWithdrawals();
    if (result.scanned > 0) {
      this.logger.log(
        `탈퇴 확정 cron scanned=${result.scanned} finalized=${result.finalized}`,
      );
    }
  }
}
