/*피드 카드 페이지가 쓰는 UI용 타입*/

export type Author = {
  id: string;
  nickname: string;
  image?: string;
};

/** 피드 UI — mapRecommendation.ts가 Api → 이 타입으로 변환 */
export type Recommendation = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: string[]; // apiTypes와 동일 — 허용값은 Nest MOODS (5단계 moods.ts)
  likeCount: number;
  likedByMe?: boolean;
  author: Author;
  createdAt: string; // ISO 8601
};

/** POST /recommendations body — Nest CreateRecommendationDto와 동일 필드 */
export type CreateRecommendationBody = {
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: string[];
};
