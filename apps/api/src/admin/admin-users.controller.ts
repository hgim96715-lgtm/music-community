import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ApiOperation({ summary: '사용자 목록 검색' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: '이메일 또는 닉네임 검색',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @Get()
  findAll(@Query('q') q?: string, @Query('role') role?: UserRole) {
    return this.adminUsersService.findAll({ q, role });
  }
}
