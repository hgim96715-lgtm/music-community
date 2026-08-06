import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminStatsService } from './admin-stats.service';
import { startOfKstDay } from 'src/common/kst-date';

const MS_PER_DAY = 86_400_000;

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

  @ApiOperation({
    summary: '통계 일 스냅샷 수동 실행 (기본=어제 KST · ?date=YYYY-MM-DD)',
  })
  @Post('stats/snapshot')
  @HttpCode(HttpStatus.OK)
  async snapshotStats(@Query('date') date?: string) {
    const day = date?.trim()
      ? new Date(`${date.trim()}T12:00:00+09:00`)
      : new Date(startOfKstDay().getTime() - MS_PER_DAY);
    return await this.adminStatsService.snapshotKstDay(day);
  }
}
