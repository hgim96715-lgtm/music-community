/** GET /recommendations 등 — Nest JSON 그대로 (Prisma serialize) */

export type ApiReaction = {
  id: string;
  recommendationId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type ApiAuthor = {
  id: string;
  nickname: string;
};

export type ApiRecommendation = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: string[];
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  reactions: ApiReaction[];
  authorId: string;
  author: ApiAuthor;
};

/** POST /auth/login · /auth/register — Nest AuthResponseDto */

export type ApiAuthUser = {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
};

export type ApiAuthResponse = {
  accessToken: string;
  user: ApiAuthUser;
};
