import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /** 이메일 */
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  /** 비밀번호 — 최소 8자 이상 */
  @ApiProperty({ example: 'password12', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  /** 닉네임 */
  @ApiProperty({ example: 'testuser' })
  @IsString()
  @IsNotEmpty()
  nickname: string;
}
