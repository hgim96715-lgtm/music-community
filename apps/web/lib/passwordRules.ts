export const MIN_PASSWORD_LENGTH = 8;

/** Web · API register.dto 와 동기화 */
export const PASSWORD_PATTERN =
  /^(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~\\]).{8,}$/;

export const PASSWORD_HINT =
  '8자 이상 · 영문 · 특수문자 (!@#$%^&*-_ 등)';

export function getPasswordRuleError(password: string): string | undefined {
  if (!password) return undefined;
  if (password.length < MIN_PASSWORD_LENGTH)
    return '비밀번호는 8자 이상이어야 합니다.';
  if (!/[a-zA-Z]/.test(password)) return '영문을 포함해주세요.';
  if (!/[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~\\]/.test(password))
    return '특수문자 (!@#$%^&* 등)를 포함해주세요.';
  return undefined;
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}
