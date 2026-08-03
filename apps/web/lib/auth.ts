import type { ApiAuthResponse, ApiAuthUser } from './apiTypes';
import { authFetchApi } from './authFetch';
import { removeApiAccessToken, setApiAccessToken } from './authToken';
import { fetchApi } from './fetchApi';

async function postAuth(
  path: 'login' | 'register',
  body: Record<string, string>,
): Promise<ApiAuthResponse> {
  const data = await fetchApi<ApiAuthResponse>(`/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  setApiAccessToken(data.accessToken);
  return data;
}

export async function login(email: string, password: string) {
  return postAuth('login', { email: email.trim(), password });
}

export function register(email: string, password: string, nickname: string) {
  return postAuth('register', {
    email: email.trim(),
    password,
    nickname: nickname.trim(),
  });
}

/** Nest GET /auth/me — 새로고침 후 user 캐시 갱신 */
export async function fetchMe(): Promise<ApiAuthUser> {
  return authFetchApi<ApiAuthUser>('/auth/me');
}

/** 로그아웃 · 401 시 */
export function clearAuthStorage(): void {
  removeApiAccessToken();
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  const q = encodeURIComponent(email.trim());
  const data = await fetchApi<{ available: boolean }>(
    `/auth/email-available?email=${q}`,
  );
  return data.available;
}

export async function checkNicknameAvailable(
  nickname: string,
): Promise<boolean> {
  const q = encodeURIComponent(nickname.trim());
  const data = await fetchApi<{ available: boolean }>(
    `/auth/nickname-available?nickname=${q}`,
  );
  return data.available;
}
