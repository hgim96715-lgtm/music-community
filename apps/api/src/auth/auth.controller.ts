import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { UserId } from './decorators/user-id.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 로그인 사용자 (Bearer)' })
  @ApiOkResponse({ type: AuthUserDto })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@UserId() userId: string) {
    return await this.authService.getMe(userId);
  }

  @ApiOperation({ summary: '회원가입' })
  @ApiOkResponse({ type: AuthResponseDto })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({ type: AuthResponseDto })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }
}
