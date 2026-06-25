import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @ApiOperation({ summary: '피드 목록 (공개)' })
  @Get()
  async findAll() {
    return await this.recommendationsService.findAll();
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 등록 (로그인 필요)' })
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateRecommendationDto) {
    return await this.recommendationsService.create(dto);
  }
}
