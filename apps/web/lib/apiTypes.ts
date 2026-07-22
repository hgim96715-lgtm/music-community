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
  image: string | null;
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
  _count?: { comments: number };
};

/** POST /auth/login · /auth/register — Nest AuthResponseDto */

export type ApiAuthUser = {
  id: string;
  email: string;
  nickname: string;
  image: string | null;
  role: 'user' | 'admin';
  bio?: string | null;
  /** 탈퇴 예약 — 있으면 유예 중 */
  deletedAt?: string | null;
  withdrawScheduledAt?: string | null;
};

export type ApiAuthResponse = {
  accessToken: string;
  user: ApiAuthUser;
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
  assetId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
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

export type ApiAdminUser = {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastActiveAt: string | null;
  _count: {
    recommendations: number;
    reactions: number;
    savedCards: number;
  };
};

export type ApiComment = {
  id: string;
  recommendationId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: ApiAuthor;
};

// Friendships

export type ApiPublicUser = {
  id: string;
  nickname: string;
  image: string | null;
  bio: string | null;
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
