import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  email: true,
  nickname: true,
  role: true,
  bio: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private trimField(value: string): string {
    return value.trim();
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    return user;
  }
  async updateMe(userId: string, dto: UpdateUserDto) {
    const data: { nickname?: string; bio?: string | null } = {};
    if (dto.nickname !== undefined) {
      const nickname = this.trimField(dto.nickname);
      const taken = await this.prisma.user.findFirst({
        where: { nickname, NOT: { id: userId } },
      });
      if (taken) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
      data.nickname = nickname;
    }
    if (dto.bio !== undefined) {
      const bio = dto.bio;
      data.bio = bio === '' ? null : bio;
    }
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: userSelect,
      });
    } catch {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
  }
}
