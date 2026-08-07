import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** GET/PATCH /users/me */
export class UserMeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  role: 'user' | 'admin';

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  withdrawScheduledAt: string | null;
}

/** GET /users/:id */
export class PublicUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;
}

export class BlockStatusDto {
  @ApiProperty()
  blockedByMe: boolean;
}
