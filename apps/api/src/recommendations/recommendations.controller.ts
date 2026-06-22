import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { JwtAuthGuard, JwtPayload } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

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
    @Req() req: Request & { user?: JwtPayload },
  ) {
    return this.recommendationsService.create(dto, req.user!.sub);
  }
}
