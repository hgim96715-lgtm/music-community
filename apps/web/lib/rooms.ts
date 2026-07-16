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
  status: RoomStatus;
  memberCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: ApiRoomOwner;
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
};

export type CreateRoomBody = {
  name: string;
  description?: string;
  topicTags?: string[];
  visibility?: RoomVisibility;
};

export type UpdateRoomBody = {
  name?: string;
  description?: string | null;
  topicTags?: string[];
  visibility?: RoomVisibility;
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
export function joinRoom(roomId: string): Promise<ApiRoomMember> {
  return authFetchApi<ApiRoomMember>(`/rooms/${roomId}/join`, {
    method: 'POST',
  });
}

/** POST /rooms/:id/leave — 204 */
export function leaveRoom(roomId: string): Promise<void> {
  return authFetchApiVoid(`/rooms/${roomId}/leave`, { method: 'POST' });
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
