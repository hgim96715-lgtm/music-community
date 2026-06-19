import { Body, Controller, Get, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';

@Controller('recommendations')
export class RecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) {}

    @Get()
    findAll(){
        return this.recommendationsService.findAll();
    }

    @Post()
    create(@Body() dto:CreateRecommendationDto){
        return this.recommendationsService.create(dto);
    }
}
