import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminNoticesService } from './admin-notices.service';
import { CreateAdminNoticeDto } from './dto/create-admin-notice.dto';
import { UpdateAdminNoticeDto } from './dto/update-admin-notice.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin/notices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminNoticesController {
  constructor(private readonly AdminNoticesService: AdminNoticesService) {}

  @ApiOperation({ summary: '공지 목록(숨김 포함)' })
  @Get()
  findAll() {
    return this.AdminNoticesService.findAll();
  }

  @ApiOperation({ summary: '공지 상세' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.AdminNoticesService.findOne(id);
  }

  @ApiOperation({ summary: '공지 작성' })
  @Post()
  create(@UserId() authorId: string, @Body() dto: CreateAdminNoticeDto) {
    return this.AdminNoticesService.create(authorId, dto);
  }

  @ApiOperation({ summary: '공지 수정 · 게시/숨김' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminNoticeDto,
  ) {
    return this.AdminNoticesService.update(id, dto);
  }

  @ApiOperation({ summary: '공지 삭제' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.AdminNoticesService.remove(id);
  }
}
