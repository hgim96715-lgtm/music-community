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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import {
  ActiveAccountGuard,
  AllowWithdrawing,
} from 'src/auth/active-account.guard';
import { SavedLyricsService } from './saved-lyrics.service';
import { CreateSavedLyricDto } from './dto/create-saved-lyric.dto';
import { UpdateSavedLyricDto } from './dto/update-saved-lyric.dto';

@ApiTags('SavedLyrics')
@Controller('saved-lyrics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ActiveAccountGuard, RolesGuard)
@Roles('user')
export class SavedLyricsController {
  constructor(private readonly savedLyricsService: SavedLyricsService) {}

  @ApiOperation({ summary: '내 가사 목록 조회' })
  @AllowWithdrawing()
  @Get()
  async findMine(@UserId() userId: string) {
    return this.savedLyricsService.findMine(userId);
  }

  @ApiOperation({ summary: '가사 소절 저장 (듣다 저장)' })
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateSavedLyricDto) {
    return this.savedLyricsService.create(userId, dto);
  }

  @ApiOperation({ summary: '가사 수정 (본인만)' })
  @Patch(':id')
  async update(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSavedLyricDto,
  ) {
    return await this.savedLyricsService.update(userId, id, dto);
  }

  @ApiOperation({ summary: '가사 삭제 (본인만)' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.savedLyricsService.delete(userId, id);
  }
}
