import { ApiRecommendation } from './apiTypes';
import { mapRecommendations } from './mapRecommendation';
import { Recommendation } from './types';

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다. 확인해주세요!',
    );
  }
  return url.replace(/\/$/, '');
}

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
