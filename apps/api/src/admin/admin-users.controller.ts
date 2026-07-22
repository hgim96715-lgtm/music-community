import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/generated/prisma/enums';
import { AdminUsersService } from './admin-users.service';
import { UsersService } from 'src/users/users.service';

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

  @ApiOperation({ summary: '사용자 목록 검색' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: '이메일 또는 닉네임 검색',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({
    name: 'inactiveDays',
    required: false,
    description: 'N일 이상 미접속 (lastActiveAt null 포함)',
  })
  @ApiQuery({
    name: 'activeToday',
    required: false,
    description: '오늘 활동한 사용자만 (true)',
  })
  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('role') role?: UserRole,
    @Query('inactiveDays', new ParseIntPipe({ optional: true }))
    inactiveDays?: number,
    @Query('activeToday', new ParseBoolPipe({ optional: true }))
    activeToday?: boolean,
  ) {
    return this.adminUsersService.findAll({
      q,
      role,
      inactiveDays,
      activeToday,
    });
  }
}
