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
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ActiveAccountGuard } from 'src/auth/active-account.guard';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';

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

  @ApiOperation({ summary: '댓글 목록(공개)' })
  @Get(':id/comments')
  async findComments(@Param('id', ParseUUIDPipe) recommendationId: string) {
    return await this.recommendationsService.findComments(recommendationId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '댓글 작성(로그인 필요)' })
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user')
  async createComment(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @Body() dto: CreateCommentDto,
    @UserId() authorId: string,
  ) {
    return await this.recommendationsService.createComment(
      recommendationId,
      authorId,
      dto.body,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '댓글 수정 (사용자만)' })
  @Patch(':id/comments/:commentId')
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user')
  async updateComment(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @UserId() userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return await this.recommendationsService.updateComment(
      recommendationId,
      commentId,
      userId,
      dto.body,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '댓글 삭제 (사용자만)' })
  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user', 'admin')
  async removeComment(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @UserId() userId: string,
  ) {
    return await this.recommendationsService.removeComment(
      recommendationId,
      commentId,
      userId,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 수정 (본인 · 당일 KST만)' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user')
  async update(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @UserId() userId: string,
    @Body() dto: UpdateRecommendationDto,
  ) {
    return await this.recommendationsService.update(
      recommendationId,
      userId,
      dto,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 삭제 (사용자만)' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  async remove(
    @Param('id', ParseUUIDPipe) recommendationId: string,
    @UserId() userId: string,
  ) {
    return await this.recommendationsService.remove(recommendationId, userId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 등록 (로그인 필요)' })
  @Post()
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user')
  async create(
    @Body() dto: CreateRecommendationDto,
    @UserId() authorId: string,
  ) {
    return await this.recommendationsService.create(dto, authorId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 좋아요 (로그인 필요)' })
  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user')
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
  @UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
  @Roles('user')
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
