import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_VALIDATION_MESSAGE,
} from '../constants/password';

export class RegisterDto {
  /** 이메일 */
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  /** 비밀번호 — 8자 이상 · 영문 · 특수문자 */
  @ApiProperty({ example: 'Password1!', minLength: 8 })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_VALIDATION_MESSAGE })
  password: string;

  /** 닉네임 */
  @ApiProperty({ example: 'testuser' })
  @IsString()
  @IsNotEmpty()
  nickname: string;
}
