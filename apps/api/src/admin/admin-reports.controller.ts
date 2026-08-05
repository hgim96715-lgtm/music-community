import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminReportsService } from './admin-reports.service';
import { ListAdminReportsQueryDto } from './dto/list-admin-reports-query.dto';
import { UpdateAdminReportDto } from './dto/update-admin-report.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @ApiOperation({ summary: '신고 목록 · status·targetType·cursor' })
  @Get()
  async list(@Query() query: ListAdminReportsQueryDto) {
    return this.adminReportsService.list(query);
  }

  @ApiOperation({ summary: '신고 처리 · resolved | dismissed' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminReportDto,
  ) {
    return this.adminReportsService.update(id, dto);
  }
}
