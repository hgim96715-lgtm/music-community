/**
 * Nest ApiRecommendation → Web Recommendation 변환
 *
 * 공개 피드(lib/api)와 글 올리기(new/action) 모두 사용.
 * 인증 여부와 무관 — 응답 JSON 모양만 맞춤.
 */
import { ApiRecommendation } from "./apiTypes";
import { Recommendation } from "./types";

/** API에 작성자 필드 없을 때 피드 카드용 */
const PLACEHOLDER_AUTHOR = {
  id: "anonymous",
  nickname: "익명",
} as const;

export function mapRecommendation(ApiItem: ApiRecommendation): Recommendation {
  const { id, title, artist, embedUrl, reason, moods, createdAt, reactions } =
    ApiItem;
  return {
    id,
    title,
    artist,
    embedUrl,
    reason,
    moods,
    likeCount: reactions.filter((reaction) => reaction.type === "like").length,
    author: PLACEHOLDER_AUTHOR,
    createdAt,
  };
}

export function mapRecommendations(
  ApiItems: ApiRecommendation[],
): Recommendation[] {
  return ApiItems.map(mapRecommendation);
}
