/** Web lib/passwordRules.ts 와 동기화 */
export const PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~\\]).{8,}$/;

export const PASSWORD_VALIDATION_MESSAGE =
  '비밀번호는 8자 이상, 영문, 특수문자(!@#$%^&* 등)를 포함해야 합니다.';
