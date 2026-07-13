/** 최근 로그인 수단 — `/login` 소셜 버튼 강조용 */

export const LAST_LOGIN_METHOD_KEY = 'mc_last_login_method' as const;

export type LastLoginMethod =
  | 'email'
  | 'google'
  | 'naver'
  | 'kakao'
  | 'apple';

const METHODS = new Set<LastLoginMethod>([
  'email',
  'google',
  'naver',
  'kakao',
  'apple',
]);

export function getLastLoginMethod(): LastLoginMethod | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(LAST_LOGIN_METHOD_KEY);
  if (!value || !METHODS.has(value as LastLoginMethod)) return null;
  return value as LastLoginMethod;
}

export function setLastLoginMethod(method: LastLoginMethod): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_LOGIN_METHOD_KEY, method);
}

export function parseOAuthProviderParam(
  value: string | null,
): Exclude<LastLoginMethod, 'email'> | null {
  if (value === 'google' || value === 'naver' || value === 'kakao' || value === 'apple') {
    return value;
  }
  return null;
}
