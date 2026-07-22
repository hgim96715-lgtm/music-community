import { IsOptional, IsString, MinLength } from 'class-validator';

/** POST /users/me/withdraw — 닉 타이핑 확인 · (이메일 가입) 비밀번호 */
export class WithdrawUserDto {
  /** 본인 nickname 또는 email 과 일치해야 함 */
  @IsString()
  @MinLength(1)
  confirm: string;

  /** passwordHash 있으면 서비스에서 필수 — 가입 password MinLength(8) 메시지와 분리 */
  @IsOptional()
  @IsString()
  password?: string;
}
