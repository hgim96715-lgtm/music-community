/**
 * API JSON types for the web client.
 *
 * OpenAPI-generated schemas (`../generated/api`) — Auth · Recommendations ·
 * Notifications · Users (1차) + Rooms · DMs · Admin list pages (2차).
 * Alias here so domain clients keep `Api*` names. saved-* · friends 등은 핸드메이드.
 *
 * Regenerate: `pnpm gen:api` (root · needs apps/api/.env).
 */
import type { components } from '../generated/api';

type Schemas = components['schemas'];

/** GET /recommendations 등 — Nest JSON 그대로 (Prisma serialize) */

export type ApiReaction = Schemas['ReactionResponseDto'];

/** author include — image는 select에 따라 없을 수 있어 클라에서 null로 정규화 */
export type ApiAuthor = Omit<Schemas['AuthorSnippetDto'], 'image'> & {
  image: string | null;
};

export type ApiRecommendation = Omit<
  Schemas['RecommendationResponseDto'],
  'author' | 'reactions' | '_count'
> & {
  reactions: ApiReaction[];
  author: ApiAuthor;
  _count?: { comments: number };
};

/** POST /auth/login · /auth/register — Nest AuthResponseDto */
export type ApiAuthUser = Schemas['AuthUserDto'] & {
  /** /auth/me는 미포함일 수 있음 — UI는 null 취급 */
  image: string | null;
};

export type ApiAuthResponse = Omit<Schemas['AuthResponseDto'], 'user'> & {
  user: ApiAuthUser;
};

export type ApiComment = Omit<
  Schemas['CommentResponseDto'],
  'author' | 'parentId' | 'deletedAt'
> & {
  parentId: string | null;
  deletedAt: string | null;
  author: ApiAuthor;
};

export type ApiPublicUser = Omit<Schemas['PublicUserDto'], 'image' | 'bio'> & {
  image: string | null;
  bio: string | null;
};

export type ApiNotificationType = Schemas['NotificationResponseDto']['type'];

export type ApiNotification = Omit<
  Schemas['NotificationResponseDto'],
  'actor' | 'readAt'
> & {
  readAt: string | null;
  actor: ApiAuthor;
};

/** GET /recommendations — cursor page */
export type ApiRecommendationsPage = {
  items: ApiRecommendation[];
  nextCursor: string | null;
};

// saved-cards
export type ApiSavedCardDisplay = {
  title?: boolean;
  artist?: boolean;
  reason?: boolean;
  moods?: boolean;
  postedAt?: boolean;
  savedAt?: boolean;
};

export type ApiSavedCardSticker = {
  /** 유니코드 이모지 또는 프리셋 id */
  assetId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export type ApiSavedCardStroke = {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
};

export type ApiSavedCardTextColors = {
  title?: string;
  artist?: string;
  reason?: string;
  moods?: string;
  postedAt?: string;
  savedAt?: string;
};

export type ApiSavedCardCustomization = {
  display?: ApiSavedCardDisplay;
  background?: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  layout?: string;
  frame?: string;
  /** music-strip 하단 플레이어 바 배경색 */
  playerBar?: string;
  textColors?: ApiSavedCardTextColors;
  stickers?: ApiSavedCardSticker[];
  /** 14.6++ 연필 낙서 */
  strokes?: ApiSavedCardStroke[];
};

export type ApiSavedCardRecommendation = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
  moods: string[];
  reason: string;
  createdAt: string;
};

export type ApiSavedCard = {
  id: string;
  userId: string;
  recommendationId: string;
  customization: ApiSavedCardCustomization;
  shelfRank: 1 | 2 | 3 | null;
  createdAt: string;
  updatedAt: string;
  recommendation: ApiSavedCardRecommendation;
};

export type ApiSavedLyric = {
  id: string;
  userId: string;
  recommendationId: string;
  lyricsText: string;
  note: string | null;
  startSec: number | null;
  endSec: number | null;
  createdAt: string;
  updatedAt: string;
  recommendation: ApiSavedCardRecommendation;
};

export type ApiSavedLyricBody = {
  recommendationId: string;
  lyricsText: string;
  note?: string;
  startSec?: number;
  endSec?: number;
};

export type UpdateSavedLyricBody = {
  lyricsText?: string;
  note?: string | null;
  startSec?: number | null;
  endSec?: number | null;
};

export type CreateSavedCardBody = {
  recommendationId: string;
  customization: ApiSavedCardCustomization;
};

// Admin

export type ApiAdminDailyCount = {
  date: string;
  count: number;
};

export type ApiAdminMonthlyCount = {
  month: string;
  count: number;
};

export type ApiAdminHourlyCount = {
  hour: number;
  count: number;
};

export type ApiAdminStats = {
  total: number;
  hidden: number;
  visible: number;
  today: number;
  daily: ApiAdminDailyCount[];
  monthly: ApiAdminMonthlyCount[];
  hourly: ApiAdminHourlyCount[];
  usersTotal: number;
  signupsToday: number;
  signupsDaily: ApiAdminDailyCount[];
  activeToday: number;
  inactive7d: number;
  activeDaily: ApiAdminDailyCount[];
};

export type ApiAdminRecommendation = ApiRecommendation & {
  hidden: boolean;
};

export type ApiAdminUser = Omit<
  Schemas['AdminUserResponseDto'],
  'lastActiveAt'
> & {
  lastActiveAt: string | null;
};

export type ApiPublicNotice = {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
};

export type ApiAdminNotice = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; nickname: string };
};

// Friendships

export type ApiUserSearchHit = {
  id: string;
  nickname: string;
  image: string | null;
};

export type ApiUserSearchPage = {
  items: ApiUserSearchHit[];
  nextCursor: string | null;
};

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
  respondedAt: string | null;
  requester: Pick<ApiPublicUser, 'id' | 'nickname' | 'image'>;
  addressee: ApiPublicUser;
};

export type ApiFriendRequests = {
  received: ApiFriendship[];
  sent: ApiFriendship[];
};

export type ApiPeriodCounts = {
  week: number;
  month: number;
  total: number;
};

export type ApiMyStatsDaily = {
  date: string;
  savedCards: number;
  savedLyrics: number;
  recommendations: number;
};

export type ApiMyStats = {
  period: {
    weekStart: string;
    monthKey: string;
  };
  savedCards: ApiPeriodCounts;
  savedLyrics: ApiPeriodCounts;
  recommendations: ApiPeriodCounts;
  daily: ApiMyStatsDaily[];
  moods: { mood: string; count: number }[];
  artists: { artist: string; count: number }[];
};

export type WithdrawResult = {
  ok: true;
  deletedAt: string;
  withdrawScheduledAt: string;
  graceDays: number;
};

export type ApiAdminRoom = Omit<
  Schemas['AdminRoomResponseDto'],
  'description' | 'passwordHint'
> & {
  description: string | null;
  passwordHint: string | null;
};
export type ApiAdminRoomsPage = {
  items: ApiAdminRoom[];
  nextCursor: string | null;
};
/** GET /admin/rooms/messages/:id — 아직 OpenAPI 미문서 */
export type ApiAdminRoomMessage = {
  id: string;
  roomId: string;
  roomName: string;
  roomStatus: string;
  type: string;
  body: string | null;
  sender: { id: string; nickname: string; email: string };
  recommendationId: string | null;
  recommendationTitle: string | null;
  deletedAt: string | null;
  deletedByOwner: boolean;
  createdAt: string;
};
export type ApiAdminUsersPage = {
  items: ApiAdminUser[];
  nextCursor: string | null;
};
export type ApiAdminReportTarget =
  | {
      kind: 'recommendation';
      title: string;
      artist: string;
      reason: string;
      hidden: boolean;
      author: { id: string; nickname: string };
    }
  | {
      kind: 'comment';
      body: string;
      recommendationId: string;
      recommendationTitle: string | null;
      author: { id: string; nickname: string };
    }
  | {
      kind: 'room_message';
      body: string | null;
      roomId: string;
      roomName: string | null;
      deletedAt: string | null;
      sender: { id: string; nickname: string };
    };

export type ApiAdminReport = Omit<
  Schemas['AdminReportResponseDto'],
  'target'
> & {
  /** polymorphic — OpenAPI는 object stub */
  target: ApiAdminReportTarget | null;
};

export type ApiAdminReportsPage = {
  items: ApiAdminReport[];
  nextCursor: string | null;
};
