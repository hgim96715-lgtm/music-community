import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserId } from 'src/auth/decorators/user-id.decorator';

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
  async create(
    @Body() dto: CreateRecommendationDto,
    @UserId() authorId: string,
  ) {
    return await this.recommendationsService.create(dto, authorId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 좋아요 (로그인 필요)' })
  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  async addLike(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @UserId() userId: string,
  ) {
    return await this.recommendationsService.addLike(recommendationId, userId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 좋아요 취소 (로그인 필요)' })
  @Delete(':id/reactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async removeLike(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @UserId() userId: string,
  ) {
    return await this.recommendationsService.removeLike(
      recommendationId,
      userId,
    );
  }
}
