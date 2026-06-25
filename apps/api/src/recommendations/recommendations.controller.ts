import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  async findAll() {
    return await this.recommendationsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateRecommendationDto) {
    return await this.recommendationsService.create(dto);
  }
}
