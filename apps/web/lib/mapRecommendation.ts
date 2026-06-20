import { ApiRecommendation } from "./apiTypes";
import { Recommendation } from "./types";

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
