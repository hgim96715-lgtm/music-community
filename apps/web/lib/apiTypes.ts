/** GET /recommendations 등 — Nest JSON 그대로 (Prisma serialize) */

export type ApiReaction = {
  id: string;
  recommendationId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
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
};
