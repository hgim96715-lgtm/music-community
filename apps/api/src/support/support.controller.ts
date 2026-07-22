import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSupportContactDto } from './dto/create-support-contact.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @ApiOperation({ summary: '게시된 공지 목록 (비로그인 OK)' })
  @Get('notices')
  listNotices() {
    return this.supportService.listPublishedNotices();
  }

  @ApiOperation({ summary: '게시된 공지 상세 (비로그인 OK)' })
  @Get('notices/:id')
  findNotice(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.findPublishedNotice(id);
  }

  @ApiOperation({ summary: '고객지원 문의 메일 전송 (비로그인 OK)' })
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async createContact(@Body() dto: CreateSupportContactDto) {
    return await this.supportService.createContact(dto);
  }
}
