import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** trim만 — 이메일·닉네임 대소문자 유지 */
  private trimField(value: string): string {
    return value.trim();
  }

  private async buildAuthResponse(user: AuthUserDto): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    };
    return { accessToken, user: authUser };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = this.trimField(dto.email);
    const nickname = this.trimField(dto.nickname);

    const byEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (byEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const byNickname = await this.prisma.user.findUnique({
      where: { nickname },
    });
    if (byNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        nickname,
        passwordHash,
      },
    });

    return this.buildAuthResponse(user);
  }

  async checkEmailAvailable(email: string): Promise<{ available: boolean }> {
    const trimmed = this.trimField(email);
    if (!trimmed) return { available: false };
    const existing = await this.prisma.user.findUnique({
      where: { email: trimmed },
    });
    return { available: !existing };
  }

  async checkNicknameAvailable(
    nickname: string,
  ): Promise<{ available: boolean }> {
    const trimmed = this.trimField(nickname);
    if (!trimmed) return { available: false };
    const existing = await this.prisma.user.findUnique({
      where: { nickname: trimmed },
    });
    return { available: !existing };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.trimField(dto.email) },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    return this.buildAuthResponse(user);
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, role: true, bio: true },
    });
    if (!user) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    }
    return user;
  }
}
