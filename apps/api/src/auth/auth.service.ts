import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { OAuthProvider, UserRole } from 'src/generated/prisma/enums';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from 'src/config/env.keys';
import type { OAuthProfile } from './oauth-profile';

const BCRYPT_ROUNDS = 12;
const LAST_ACTIVE_THROTTLE_MS = 60_000;

const NICKNAME_MAX = 10;
const NICKNAME_MIN = 2;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  /** trim만 — 이메일·닉네임 대소문자 유지 */
  private trimField(value: string): string {
    return value.trim();
  }

  private readonly lastActiveAt = new Map<string, number>();

  private async touchLastActiveAt(
    userId: string,
    role: UserRole,
    options?: { force?: boolean },
  ): Promise<void> {
    if (role !== UserRole.user) return;
    const now = Date.now();
    if (!options?.force) {
      const prev = this.lastActiveAt.get(userId) ?? 0;
      if (now - prev < LAST_ACTIVE_THROTTLE_MS) {
        return;
      }
    }
    this.lastActiveAt.set(userId, now);
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date(now) },
    });
  }

  touchLastActiveAtFromGuard(userId: string, role: UserRole): void {
    void this.touchLastActiveAt(userId, role).catch((error) => {
      this.logger.warn(
        `lastActiveAt 업데이트 실패: user=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    nickname: string;
    role: 'user' | 'admin';
    bio?: string | null;
    deletedAt?: Date | string | null;
    withdrawScheduledAt?: Date | string | null;
  }): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const deletedAt =
      user.deletedAt instanceof Date
        ? user.deletedAt.toISOString()
        : (user.deletedAt ?? null);
    const withdrawScheduledAt =
      user.withdrawScheduledAt instanceof Date
        ? user.withdrawScheduledAt.toISOString()
        : (user.withdrawScheduledAt ?? null);
    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      bio: user.bio ?? null,
      deletedAt,
      withdrawScheduledAt,
    };
    return { accessToken, user: authUser };
  }

  private mapOAuthError(
    error: unknown,
  ):
    | 'email_not_verified'
    | 'email_missing'
    | 'provider_error'
    | 'account_link_failed'
    | 'account_withdrawn' {
    if (
      error instanceof UnauthorizedException &&
      error.message === '탈퇴가 완료된 계정입니다.'
    ) {
      return 'account_withdrawn';
    }
    if (
      error instanceof Error &&
      [
        'email_not_verified',
        'email_missing',
        'provider_error',
        'account_link_failed',
        'account_withdrawn',
      ].includes(error.message)
    ) {
      return error.message as
        | 'email_not_verified'
        | 'email_missing'
        | 'provider_error'
        | 'account_link_failed'
        | 'account_withdrawn';
    }
    return 'provider_error';
  }

  private buildOAuthSuccessRedirect(
    accessToken: string,
    next: string,
    provider: OAuthProvider,
  ): string {
    const url = new URL(
      '/auth/oauth/callback',
      this.configService.getOrThrow<string>(EnvKeys.FRONTEND_URL),
    );
    url.searchParams.set('accessToken', accessToken);
    url.searchParams.set('next', next);
    url.searchParams.set('provider', provider);
    return url.toString();
  }

  private buildOAuthFailureRedirect(
    oauthError:
      | 'email_not_verified'
      | 'email_missing'
      | 'provider_error'
      | 'account_link_failed'
      | 'account_withdrawn',
    next: string,
  ): string {
    const url = new URL(
      '/login',
      this.configService.getOrThrow<string>(EnvKeys.FRONTEND_URL),
    );
    url.searchParams.set('next', next);
    url.searchParams.set('oauthError', oauthError);
    return url.toString();
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
    if (user.deletedAt && !user.withdrawScheduledAt) {
      throw new UnauthorizedException('탈퇴가 완료된 계정입니다.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    await this.touchLastActiveAt(user.id, user.role, { force: true });
    return this.buildAuthResponse(user);
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        bio: true,
        deletedAt: true,
        withdrawScheduledAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    }
    // 확정 tombstone만 — 유예(deletedAt+스케줄)는 /me 허용
    if (user.deletedAt && !user.withdrawScheduledAt) {
      throw new UnauthorizedException('탈퇴가 완료된 계정입니다.');
    }

    await this.touchLastActiveAt(userId, user.role, { force: true });
    return {
      ...user,
      deletedAt: user.deletedAt?.toISOString() ?? null,
      withdrawScheduledAt: user.withdrawScheduledAt?.toISOString() ?? null,
    };
  }

  async loginWithOAuth(profile: OAuthProfile): Promise<AuthResponseDto> {
    if (!profile.emailVerified) {
      throw new Error('email_not_verified');
    }
    if (!profile.email) {
      throw new Error('email_missing');
    }

    const email = this.trimField(profile.email);
    const { provider, providerAccountId } = profile;
    try {
      const existingAccount = await this.prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true },
      });
      if (existingAccount) {
        const user = existingAccount.user;
        if (user.deletedAt && !user.withdrawScheduledAt) {
          throw new UnauthorizedException('탈퇴가 완료된 계정입니다.');
        }
        await this.touchLastActiveAt(user.id, user.role, { force: true });
        return this.buildAuthResponse(user);
      }
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        if (existingUser.deletedAt && !existingUser.withdrawScheduledAt) {
          throw new UnauthorizedException('탈퇴가 완료된 계정입니다.');
        }
        await this.prisma.oAuthAccount.create({
          data: { provider, providerAccountId, userId: existingUser.id },
        });
        return this.buildAuthResponse(existingUser);
      }
      const nickname = await this.suggestNickname(profile.displayName, email);
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { email, nickname, passwordHash: null },
        });
        await tx.oAuthAccount.create({
          data: { provider, providerAccountId, userId: created.id },
        });
        return created;
      });
      await this.touchLastActiveAt(user.id, user.role, { force: true });
      return this.buildAuthResponse(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error && error.message.startsWith('email_')) {
        throw error;
      }
      this.logger.error(
        `${provider} OAuth 로그인 실패`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error('account_link_failed');
    }
  }

  async handleOAuthCallback(
    profile: OAuthProfile,
    next: string,
  ): Promise<string> {
    try {
      const { accessToken } = await this.loginWithOAuth(profile);
      return this.buildOAuthSuccessRedirect(
        accessToken,
        next,
        profile.provider,
      );
    } catch (error) {
      return this.buildOAuthFailureRedirect(this.mapOAuthError(error), next);
    }
  }

  private normalizeNicknameBase(
    displayName: string | null,
    email: string,
  ): string {
    const raw = (displayName?.trim() || email.split('@')[0] || 'user')
      .replace(/\./g, '')
      .replace(/\s+/g, '');
    if (raw.length < NICKNAME_MIN) {
      return `user${raw}`.slice(0, NICKNAME_MAX);
    }
    return raw.slice(0, NICKNAME_MAX);
  }

  private async suggestNickname(
    displayName: string | null,
    email: string,
  ): Promise<string> {
    const base = this.normalizeNicknameBase(displayName, email);
    let candidate = base;
    let suffix = 2;
    while (
      await this.prisma.user.findUnique({ where: { nickname: candidate } })
    ) {
      const suffixText = String(suffix);
      candidate = `${base.slice(0, NICKNAME_MAX - suffixText.length)}${suffixText}`;
      suffix += 1;
    }
    return candidate;
  }
}
