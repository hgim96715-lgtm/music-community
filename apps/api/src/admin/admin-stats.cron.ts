import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  formatKstDateTime,
  startOfKstDay,
  toKstDateKey,
} from 'src/common/kst-date';
import { AdminStatsService } from './admin-stats.service';
import { MailService } from 'src/mail/mail.service';

const MS_PER_DAY = 86_400_000;

@Injectable()
export class AdminStatsCron {
  constructor(
    private readonly adminStatsService: AdminStatsService,
    private readonly mailService: MailService,
  ) {}
  private readonly logger = new Logger(AdminStatsCron.name);

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { timeZone: 'Asia/Seoul' })
  async snapshotYesterday() {
    const yesterday = new Date(startOfKstDay().getTime() - MS_PER_DAY);
    try {
      const result = await this.adminStatsService.snapshotKstDay(yesterday);
      this.logger.log(
        `stats snapshot 날짜 =${result.date} 추천=${result.recommendations} 가입=${result.signups} 활동=${result.active}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const targetDate = toKstDateKey(yesterday);
      const failedAt = formatKstDateTime();
      this.logger.error(
        `통계 스냅샷 실패 · 대상일=${targetDate} · 시각=${failedAt} · 내용=${message}`,
      );
      await this.mailService.sendOpsAlert(
        `통계 스냅샷 실패 · ${targetDate}`,
        `대상일(KST): ${targetDate}
실패 시각(KST): ${failedAt}
내용: ${message}

재실행: Admin 「어제 스냅샷 저장」
또는 POST /admin/stats/snapshot`,
      );
    }
  }
}
