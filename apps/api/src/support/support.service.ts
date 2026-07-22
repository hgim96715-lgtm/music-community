import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { CreateSupportContactDto } from './dto/create-support-contact.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const publicNoticeSelect = {
  id: true,
  title: true,
  body: true,
  publishedAt: true,
} as const;
@Injectable()
export class SupportService {
  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  listPublishedNotices() {
    return this.prisma.notice.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: publicNoticeSelect,
    });
  }

  async findPublishedNotice(id: string) {
    const row = await this.prisma.notice.findFirst({
      where: { id, published: true },
      select: publicNoticeSelect,
    });
    if (!row) {
      throw new NotFoundException('공지가 존재하지 않습니다.');
    }
    return row;
  }
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
