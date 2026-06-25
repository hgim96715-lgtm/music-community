import { ApiAuthResponse, ApiRecommendation } from './apiTypes';
import { setApiAccessToken } from './authToken';
import { getApiBaseUrl } from './fetchApi';
import { mapRecommendations } from './mapRecommendation';
import { Recommendation } from './types';

/** 공개 피드 — Bearer 없음 */
export async function fetchRecommendations(
  currentUserId?: string,
): Promise<Recommendation[]> {
  const res = await fetch(`${getApiBaseUrl()}/recommendations`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `/recommendations 요청 실패: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as ApiRecommendation[];
  return mapRecommendations(data, currentUserId);
}

async function postAuth(
  path: 'login' | 'register',
  body: Record<string, string>,
): Promise<ApiAuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = (await res.json()) as { message?: string | string[] } | null;
    const message = Array.isArray(error?.message)
      ? error.message[0]
      : error?.message;
    throw new Error(
      message ?? `Auth ${path} 요청 실패: ${res.status} ${res.statusText}`,
    );
  }
  const data = (await res.json()) as ApiAuthResponse;
  setApiAccessToken(data.accessToken);
  return data;
}

export async function login(email: string, password: string) {
  return postAuth('login', { email, password });
}

export function register(email: string, password: string, nickname: string) {
  return postAuth('register', { email, password, nickname });
}
