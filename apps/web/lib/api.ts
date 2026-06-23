/**
 * 공개 API — 로그인·Bearer 없이 Nest 호출
 *
 * 피드(/) 등 비로그인 읽기 전용.
 * 글 올리기·관리자 → app/new/action.ts, lib/adminFetch.ts (getApiAccessToken)
 */
import { ApiRecommendation } from "./apiTypes";
import { mapRecommendations } from "./mapRecommendation";
import type { Recommendation } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchRecommendation(
  currentUserId?: string,
): Promise<Recommendation[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!");
  }

  const res = await fetch(`${API_URL}/recommendations`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(
      `API 요청실패 GET /recommendations 응답코드: ${res.status}`,
    );
  }

  const data = (await res.json()) as ApiRecommendation[];
  return mapRecommendations(data, currentUserId);
}
