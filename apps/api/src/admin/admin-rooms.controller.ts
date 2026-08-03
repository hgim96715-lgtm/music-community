import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminRoomsService } from './admin-rooms.service';
import { ListAdminRoomsQueryDto } from './dto/list-admin-rooms-query.dto';

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
}
