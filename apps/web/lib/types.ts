export type Mood =
  | "새벽"
  | "운전"
  | "집중"
  | "운동"
  | "비"
  | "설렘"
  | "우울"
  | "파티"
  | "힐링"
  | "그리움";

/** 피드·프로필에 표시할 추천자 (`@닉네임`) — `profile.md` */
export type Author = {
  id: string;
  nickname: string;
  image?: string;
};

/**
 * 피드 카드 UI용 — `apps/web/lib/types.ts`
 *
 * API `GET /recommendations` 응답과 필드가 다름 (아래 표).
 * 3단계 목 데이터 · 4단계 연동 시 mapper로 맞춤 — `routes.md` Web 타입.
 * likedByMe: 내가 좋아요 눌렀는지 — v0 로그인 없으면 생략/false, Heart UI (`icons.md`)
 * createdAt: ISO 8601 — 표시: `date.md` → YYYY.MM.DD
 */
export type Recommendation = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: Mood[];
  likeCount: number;
  likedByMe?: boolean;
  author: Author;
  createdAt: string;
};

/** 작성 폼 POST body — API `CreateRecommendationDto`와 동일 필드 */
export type CreateRecommendationBody = {
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: Mood[];
};
