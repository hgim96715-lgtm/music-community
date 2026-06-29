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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SavedCardsService } from './saved-cards.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { CreateSavedCardDto } from './dto/create-saved-card.dto';
import { UpdateSavedCardDto } from './dto/update-saved-card.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('SavedCards')
@Controller('saved-cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class SavedCardsController {
  constructor(private readonly savedCardsService: SavedCardsService) {}

  @ApiOperation({ summary: '내 앨범 목록' })
  @Get()
  async findMine(@UserId() userId: string) {
    return await this.savedCardsService.findMine(userId);
  }

  @ApiOperation({ summary: '추천을 포토카드로 저장 (본인 글만)' })
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateSavedCardDto) {
    return await this.savedCardsService.create(userId, dto);
  }

  @ApiOperation({ summary: '포토카드 수정 (본인 글만)' })
  @Patch(':id')
  async update(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) savedCardId: string,
    @Body() dto: UpdateSavedCardDto,
  ) {
    return await this.savedCardsService.update(userId, savedCardId, dto);
  }

  @ApiOperation({ summary: '포토카드 삭제 (저장한 본인만)' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) savedCardId: string,
  ) {
    return await this.savedCardsService.delete(userId, savedCardId);
  }
}
