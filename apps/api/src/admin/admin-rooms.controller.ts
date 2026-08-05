import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminRoomsService } from './admin-rooms.service';
import { ListAdminRoomsQueryDto } from './dto/list-admin-rooms-query.dto';
import { UpdateAdminRoomDto } from './dto/update-admin-room.dto';
import { UserId } from 'src/auth/decorators/user-id.decorator';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin/rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminRoomsController {
  constructor(private readonly adminRoomsService: AdminRoomsService) {}

  @ApiOperation({ summary: '방 목록 (운영) · q·status·cursor' })
  @Get()
  async list(@Query() query: ListAdminRoomsQueryDto) {
    return this.adminRoomsService.list(query);
  }

  @ApiOperation({ summary: '방 메시지 상세 (신고 원문)' })
  @Get('messages/:messageId')
  async getMessage(@Param('messageId', ParseUUIDPipe) messageId: string) {
    return this.adminRoomsService.getMessage(messageId);
  }

  @ApiOperation({
    summary: '방 상태 · active/closed/archived · 닫기·보관 시 reason',
  })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminRoomDto,
    @UserId() adminUserId: string,
  ) {
    return this.adminRoomsService.update(id, dto, adminUserId);
  }
}
