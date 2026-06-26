/**
 * 로그인·가입 후 돌아갈 path.
 * URL 쿼리 키는 **`next`만** 쓴다 (callbackUrl · redirectTo 와 같은 개념, 이름 통일).
 */

export const REDIRECT_QUERY_KEY = 'next' as const;

export const DEFAULT_AUTH_REDIRECT = '/recommendations';

/** 내부 path만 허용 — 오픈 리다이렉트 방지 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT;
  }
  return path;
}

type SearchParamsLike = Pick<URLSearchParams, 'get'>;

export function getRedirectPathFromSearchParams(
  params: SearchParamsLike,
): string {
  return sanitizeRedirectPath(params.get(REDIRECT_QUERY_KEY));
}

function buildAuthHref(
  basePath: '/login' | '/register',
  redirectPath?: string,
): string {
  const path = sanitizeRedirectPath(redirectPath);
  if (path === DEFAULT_AUTH_REDIRECT) {
    return basePath;
  }
  return `${basePath}?${REDIRECT_QUERY_KEY}=${encodeURIComponent(path)}`;
}

export function buildLoginHref(redirectPath?: string): string {
  return buildAuthHref('/login', redirectPath);
}

export function buildRegisterHref(redirectPath?: string): string {
  return buildAuthHref('/register', redirectPath);
}
