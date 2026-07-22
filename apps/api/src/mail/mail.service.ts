import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EnvKeys } from 'src/config/env.keys';

export type SupportContactMail = {
  fromEmail: string;
  nickname?: string;
  subject: string;
  body: string;
};
export type MailProvider = 'gmail' | 'icloud';

const PROVIDER_DEFAULTS: Record<MailProvider, { host: string; port: number }> =
  {
    gmail: { host: 'smtp.gmail.com', port: 587 },
    icloud: { host: 'smtp.mail.me.com', port: 587 },
  };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly mailFrom: string;
  private readonly supportTo: string;
  private readonly provider: MailProvider;

  private resolveProvider(): MailProvider {
    const raw = this.configService
      .getOrThrow<string>(EnvKeys.MAIL_PROVIDER)
      .trim()
      .toLowerCase();
    if (raw === 'gmail' || raw === 'icloud') return raw;
    throw new Error(
      `Mail provider는 "gmail" 또는 "icloud" 중 하나여야 합니다. (제공된 값: ${raw})`,
    );
  }

  private resolvePort(
    raw: string | number | undefined,
    fallback: number,
  ): number {
    if (raw === undefined || raw === '') return fallback;
    const port = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(port) || port <= 0) {
      throw new Error(`SMTP_PORT는 양수여야 합니다. (제공된 값: ${raw})`);
    }
    return port;
  }

  constructor(private readonly configService: ConfigService) {
    this.provider = this.resolveProvider();
    const defaults = PROVIDER_DEFAULTS[this.provider];

    const host =
      this.configService.get<string>(EnvKeys.SMTP_HOST)?.trim() ||
      defaults.host;
    const port = this.resolvePort(
      this.configService.get<string | number>(EnvKeys.SMTP_PORT),
      defaults.port,
    );
    const user = this.configService.getOrThrow<string>(EnvKeys.SMTP_USER);
    const pass = this.configService.getOrThrow<string>(EnvKeys.SMTP_PASS);

    this.mailFrom = this.configService.getOrThrow<string>(EnvKeys.MAIL_FROM);
    this.supportTo = this.configService.getOrThrow<string>(
      EnvKeys.MAIL_SUPPORT_TO,
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    this.logger.log(`mail ready · provider=${this.provider} · host=${host}`);
  }
  async sendSupportContact(input: SupportContactMail): Promise<void> {
    const nickname = input.nickname?.trim() || '익명';
    const subject = `[문의] ${input.subject.trim()}`;
    const text = [
      `닉네임: ${nickname}`,
      `회신 이메일: ${input.fromEmail.trim()}`,
      '',
      input.body.trim(),
    ].join('\n');

    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to: this.supportTo,
        replyTo: input.fromEmail.trim(),
        subject,
        text,
      });
    } catch (error) {
      this.logger.error(
        `문의 메일 전송 실패 · error=${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
