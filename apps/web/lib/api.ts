import { ApiAuthResponse, ApiRecommendation } from './apiTypes';
import { setApiAccessToken } from './authToken';
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
  return postAuth('login', { email, password });
}

export function register(email: string, password: string, nickname: string) {
  return postAuth('register', { email, password, nickname });
}
