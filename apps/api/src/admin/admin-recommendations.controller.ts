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
import { AdminGuard } from 'src/auth/admin.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminRecommendationsService } from './admin-recommendations.service';
import { UpdateAdminRecommendationDto } from './dto/update-admin-recommendation.dto';

@Controller('admin/recommendations')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminRecommendationsController {
  constructor(
    private readonly adminRecommendationsService: AdminRecommendationsService,
  ) {}
  @Get()
  findAll() {
    return this.adminRecommendationsService.findAll();
  }
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminRecommendationDto,
  ) {
    return this.adminRecommendationsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminRecommendationsService.remove(id);
  }
}
