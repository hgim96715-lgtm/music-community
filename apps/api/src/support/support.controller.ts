import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSupportContactDto } from './dto/create-support-contact.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @ApiOperation({ summary: '고객지원 문의 메일 전송 (비로그인 OK)' })
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async createContact(@Body() dto: CreateSupportContactDto) {
    return await this.supportService.createContact(dto);
  }
}
