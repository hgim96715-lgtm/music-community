import { Body, Controller, Get, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';

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
  async create(@Body() dto: CreateRecommendationDto) {
    return await this.recommendationsService.create(dto);
  }
}
