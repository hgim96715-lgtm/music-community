import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /** 이메일 */
  @IsEmail()
  email: string;

  /** 비밀번호 — 최소 8자 이상 */
  @IsString()
  @MinLength(8)
  password: string;

  /** 닉네임 */
  @IsString()
  @IsNotEmpty()
  nickname: string;
}
