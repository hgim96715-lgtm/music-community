import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** 이메일 */
  @IsEmail()
  email: string;

  /** 비밀번호 — 최소 8자 이상 */
  @IsString()
  @MinLength(8)
  password: string;
}
