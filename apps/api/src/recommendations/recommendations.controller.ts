import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  findAll() {
    return this.recommendationsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateRecommendationDto,
    @UserId() userId: string,
  ) {
    return this.recommendationsService.create(dto, userId);
  }
}
