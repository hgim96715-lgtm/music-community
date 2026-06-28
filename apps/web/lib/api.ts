import { ApiAuthResponse, ApiAuthUser, ApiRecommendation } from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';
import { removeApiAccessToken, setApiAccessToken } from './authToken';
import { fetchApi } from './fetchApi';
import { mapRecommendations } from './mapRecommendation';
import { Recommendation } from './types';

/** 공개 피드 — Bearer 없음 */
export async function fetchRecommendations(
  currentUserId?: string,
): Promise<Recommendation[]> {
  const data = await fetchApi<ApiRecommendation[]>('/recommendations', {
    credentials: 'include',
    cache: 'no-store',
  });
  return mapRecommendations(data, currentUserId);
}

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

/** DELETE /recommendations/:id — 본인 글만 삭제 */
export function deleteRecommendation(id: string) {
  return authFetchApiVoid(`/recommendations/${id}`, { method: 'DELETE' });
}
