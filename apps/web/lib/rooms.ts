import { authFetchApi, authFetchApiVoid } from './authFetch';

export type RoomVisibility = 'public' | 'private' | 'invite';
export type RoomStatus = 'active' | 'closed' | 'archived';
export type RoomMessageType = 'text' | 'recommendation';

export type ApiRoomOwner = {
  id: string;
  nickname: string;
  image: string | null;
};

export type ApiRoom = {
  id: string;
  name: string;
  description: string | null;
  topicTags: string[];
  visibility: RoomVisibility;
  passwordHint: string | null;
  status: RoomStatus;
  memberCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: ApiRoomOwner;
  /** `/rooms/mine`만 · 최근 메시지 시각 */
  lastMessageAt?: string | null;
};

export type ApiRoomMember = {
  id: string;
  roomId: string;
  userId: string;
  role: 'member' | 'moderator' | 'owner';
  mutedUntil: string | null;
  joinedAt: string;
};

export type ApiRoomMemberWithUser = ApiRoomMember & {
  user: ApiRoomOwner;
};

export function fetchRoomMembers(
  roomId: string,
): Promise<ApiRoomMemberWithUser[]> {
  return authFetchApi<ApiRoomMemberWithUser[]>(`/rooms/${roomId}/members`);
}

export type ApiRoomRecommendation = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
  moods: string[];
};

export type ApiRoomMessage = {
  id: string;
  roomId: string;
  senderId: string;
  type: RoomMessageType;
  body: string | null;
  recommendationId: string | null;
  createdAt: string;
  deletedAt: string | null;
  sender: ApiRoomOwner;
  recommendation: ApiRoomRecommendation | null;
};

/** 공백·쉼표 구분 · `#` 제거 · 최대 8개 */
export function parseTopicTags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

export type CreateRoomBody = {
  name: string;
  description?: string;
  topicTags?: string[];
  visibility?: RoomVisibility;
  password?: string;
  passwordHint?: string | null;
};

export type UpdateRoomBody = {
  name?: string;
  description?: string | null;
  topicTags?: string[];
  visibility?: RoomVisibility;
  password?: string;
  passwordHint?: string | null;
};

export type CreateRoomMessageBody =
  | { type: 'text'; body: string }
  | { type: 'recommendation'; recommendationId: string };

/** GET /rooms */
export function fetchPublicRooms(): Promise<ApiRoom[]> {
  return authFetchApi<ApiRoom[]>('/rooms');
}

/** GET /rooms/mine */
export function fetchMyRooms(): Promise<ApiRoom[]> {
  return authFetchApi<ApiRoom[]>('/rooms/mine');
}

/** GET /rooms/:id */
export function fetchRoom(roomId: string): Promise<ApiRoom> {
  return authFetchApi<ApiRoom>(`/rooms/${roomId}`);
}

/** POST /rooms */
export function createRoom(body: CreateRoomBody): Promise<ApiRoom> {
  return authFetchApi<ApiRoom>('/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** PATCH /rooms/:id */
export function updateRoom(
  roomId: string,
  body: UpdateRoomBody,
): Promise<ApiRoom> {
  return authFetchApi<ApiRoom>(`/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** POST /rooms/:id/join */
export function joinRoom(
  roomId: string,
  password?: string,
): Promise<ApiRoomMember> {
  return authFetchApi<ApiRoomMember>(`/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(password ? { password } : {}),
  });
}

/** POST /rooms/:id/leave — 204 */
export function leaveRoom(roomId: string): Promise<void> {
  return authFetchApiVoid(`/rooms/${roomId}/leave`, { method: 'POST' });
}
/** POST /rooms/:id/close — 방장만 · status=closed */
export function closeRoom(roomId: string): Promise<ApiRoom> {
  return authFetchApi<ApiRoom>(`/rooms/${roomId}/close`, {
    method: 'POST',
  });
}

/** POST /rooms/:id/transfer — 방장만 · body { userId } */
export function transferRoom(roomId: string, userId: string): Promise<ApiRoom> {
  return authFetchApi<ApiRoom>(`/rooms/${roomId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

/** POST /rooms/:id/members/:userId/kick — 방장만 · 204 */
export function kickRoomMember(roomId: string, userId: string): Promise<void> {
  return authFetchApiVoid(`/rooms/${roomId}/members/${userId}/kick`, {
    method: 'POST',
  });
}

/** GET /rooms/:id/messages */
export function fetchRoomMessages(roomId: string): Promise<ApiRoomMessage[]> {
  return authFetchApi<ApiRoomMessage[]>(`/rooms/${roomId}/messages`);
}

/** POST /rooms/:id/messages */
export function createRoomMessage(
  roomId: string,
  body: CreateRoomMessageBody,
): Promise<ApiRoomMessage> {
  return authFetchApi<ApiRoomMessage>(`/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** DELETE /rooms/:id/messages/:messageId — 전체에서 삭제 · 204 */
export function deleteRoomMessage(
  roomId: string,
  messageId: string,
): Promise<void> {
  return authFetchApiVoid(`/rooms/${roomId}/messages/${messageId}`, {
    method: 'DELETE',
  });
}
