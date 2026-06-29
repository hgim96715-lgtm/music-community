import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminStatsService } from './admin-stats.service';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @ApiOperation({ summary: '관리자 대시보드 통계' })
  @Get('stats')
  async getStats() {
    return await this.adminStatsService.getStats();
  }
}
