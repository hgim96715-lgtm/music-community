import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
}
