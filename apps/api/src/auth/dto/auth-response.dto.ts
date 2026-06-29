import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @ApiProperty({ example: 'testuser' })
  nickname: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  role: 'user' | 'admin';

  @ApiPropertyOptional({ example: '안녕하세요, 저는 노래가 좋아요.' })
  bio?: string | null;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
