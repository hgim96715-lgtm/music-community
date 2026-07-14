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
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 조회' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@UserId() userId: string) {
    return await this.usersService.getMe(userId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 수정' })
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@UserId() userId: string, @Body() dto: UpdateUserDto) {
    return await this.usersService.updateMe(userId, dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 차단' })
  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async block(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) blockedId: string,
  ) {
    return await this.usersService.blockUser(userId, blockedId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내가 이 사용자를 차단했는지' })
  @Get(':id/block-status')
  @UseGuards(JwtAuthGuard)
  async getBlockStatus(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) blockedId: string,
  ) {
    return await this.usersService.getBlockStatus(userId, blockedId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 차단 해제' })
  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) blockedId: string,
  ) {
    return await this.usersService.unblockerUser(userId, blockedId);
  }

  @ApiOperation({ summary: '공개 프로필 조회' })
  @Get(':id')
  async findPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usersService.findPublicProfile(id);
  }
}
