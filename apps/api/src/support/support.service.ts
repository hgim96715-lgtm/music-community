import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { CreateSupportContactDto } from './dto/create-support-contact.dto';

@Injectable()
export class SupportService {
  constructor(private readonly mailService: MailService) {}
  async createContact(dto: CreateSupportContactDto): Promise<{ ok: true }> {
    try {
      await this.mailService.sendSupportContact({
        fromEmail: dto.fromEmail,
        nickname: dto.nickname,
        subject: dto.subject,
        body: dto.body,
      });
      return { ok: true };
    } catch {
      throw new ServiceUnavailableException(
        '문의 메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }
}
