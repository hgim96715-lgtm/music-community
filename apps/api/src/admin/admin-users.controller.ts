import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { UsersService } from 'src/users/users.service';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { AdminUsersPageDto } from './dto/admin-list-response.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: '유예 만료 탈퇴 확정 (cron 수동 실행)' })
  @Post('withdraw/finalize')
  @HttpCode(HttpStatus.OK)
  async finalizeWithdrawals() {
    return await this.usersService.finalizeExpiredWithdrawals();
  }

  @ApiOperation({ summary: '사용자 목록 · q·필터·cursor' })
  @ApiOkResponse({ type: AdminUsersPageDto })
  @Get()
  async findAll(@Query() query: ListAdminUsersQueryDto) {
    return await this.adminUsersService.findAll(query);
  }
}
