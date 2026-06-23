import { Mood } from './types';

/** `GET /recommendations` 응답 1건 — API JSON 그대로 */

export type ApiReaction = {
  id: string;
  recommendationId: string;
  type: string;
  createdAt: string;
  userId: string;
};

export type ApiAuthor = {
  id: string;
  nickname: string;
  image?: string;
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
  authorId: string;
  author?: ApiAuthor | null;
};

/** `GET /admin/stats` 응답 1건 — API JSON 그대로 */

export type ApiAdminStats = {
  total: number;
  hidden: number;
  visible: number;
  today: number;
};

/** `GET /friends`, `GET /friends/requests` 등 — Friendship JSON 그대로 */

export type ApiFriendshipStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'removed';

export type ApiFriendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ApiFriendshipStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  requester: ApiAuthor;
  addressee: ApiAuthor;
};

/** `GET /friends/requests` 응답 */
export type ApiFriendRequests = {
  received: ApiFriendship[];
  sent: ApiFriendship[];
};

/** `GET /users/:id` 응답 */
export type ApiPublicProfile = {
  id: string;
  nickname: string | null;
  image?: string;
};
