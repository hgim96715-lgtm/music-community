import { Mood } from "./types";

/** `GET /recommendations` 응답 1건 — API JSON 그대로 */

export type ApiReaction = {
  id: string;
  recommendationId: string;
  type: string;
  createdAt: string;
};

export type ApiRecommendation = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: Mood[];
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  reactions: ApiReaction[];
};

/** `GET /admin/stats` 응답 1건 — API JSON 그대로 */

export type ApiAdminStats = {
  total: number;
  hidden: number;
  visible: number;
  today: number;
};
