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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminRecommendationsService } from './admin-recommendations.service';
import { UpdateAdminRecommendationDto } from './dto/update-admin-recommendation.dto';
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin/recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminRecommendationsController {
  constructor(
    private readonly adminRecommendationsService: AdminRecommendationsService,
  ) {}

  @ApiOperation({ summary: '추천 전체 목록(숨김 포함)' })
  @Get()
  async findAll() {
    return this.adminRecommendationsService.findAll();
  }

  @ApiOperation({ summary: '추천 상세 조회' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminRecommendationsService.findOne(id);
  }

  @ApiOperation({ summary: '추천 수정 (숨김 등)' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminRecommendationDto,
  ) {
    return await this.adminRecommendationsService.update(id, dto);
  }

  @ApiOperation({ summary: '추천 영구 삭제' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminRecommendationsService.remove(id);
  }
}
