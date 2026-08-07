import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { UserId } from './decorators/user-id.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ActiveAccountGuard,
  AllowWithdrawing,
} from './active-account.guard';
import { AvailableResponseDto } from 'src/common/dto/available-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 로그인 사용자 (Bearer)' })
  @ApiOkResponse({ type: AuthUserDto })
  @Get('me')
  @AllowWithdrawing()
  @UseGuards(JwtAuthGuard, ActiveAccountGuard)
  async getMe(@UserId() userId: string) {
    return await this.authService.getMe(userId);
  }

  @ApiOperation({ summary: '이메일 사용 가능 여부' })
  @ApiOkResponse({ type: AvailableResponseDto })
  @Get('email-available')
  async checkEmail(@Query('email') email: string) {
    return await this.authService.checkEmailAvailable(email);
  }

  @ApiOperation({ summary: '닉네임 사용 가능 여부' })
  @ApiOkResponse({ type: AvailableResponseDto })
  @Get('nickname-available')
  async checkNickname(@Query('nickname') nickname: string) {
    return await this.authService.checkNicknameAvailable(nickname);
  }

  @ApiOperation({ summary: '회원가입' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
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
