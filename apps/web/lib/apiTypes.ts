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

export type ApiComment = {
  id: string;
  recommendationId: string;
  authorId: string;
  body: string;
  parentId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ApiAuthor;
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

export type ApiAdminRoom = {
  id: string;
  name: string;
  description: string | null;
  topicTags: string[];
  visibility: 'public' | 'private' | 'invite';
  status: 'active' | 'closed' | 'archived';
  memberCount: number;
  passwordHint: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: { id: string; nickname: string; email: string };
};
export type ApiAdminRoomsPage = {
  items: ApiAdminRoom[];
  nextCursor: string | null;
};
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

export type ApiAdminReport = {
  id: string;
  targetType: 'comment' | 'room_message' | 'recommendation';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; nickname: string; email: string };
  target: ApiAdminReportTarget | null;
  targetMissing: boolean;
};

export type ApiAdminReportsPage = {
  items: ApiAdminReport[];
  nextCursor: string | null;
};

export type ApiNotificationType = 'comment_reply';

export type ApiNotification = {
  id: string;
  userId: string;
  type: ApiNotificationType;
  recommendationId: string;
  commentId: string;
  actorId: string;
  readAt: string | null;
  createdAt: string;
  actor: ApiAuthor;
};
