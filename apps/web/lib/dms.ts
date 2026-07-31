import { authFetchApi } from './authFetch';
export type DmStatus = 'pending' | 'open' | 'declined';

export type ApiDmUser = {
  id: string;
  nickname: string;
  image: string | null;
};

export type ApiDmLastMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

export type ApiDmListItem = {
  id: string;
  status: DmStatus;
  updatedAt: string;
  other: ApiDmUser | null;
  lastMessage: ApiDmLastMessage | null;
  unread: boolean;
};

export type ApiDmRequestItem = {
  id: string;
  status: DmStatus;
  requestedById: string | null;
  createdAt: string;
  other: ApiDmUser | null;
};

export type apiDmMember = {
  id: string;
  dmId: string;
  userId: string;
  lastReadAt: string;
  joinedAt: string;
  user: ApiDmUser;
};

export type ApiDm = {
  id: string;
  pairKey: string;
  status: DmStatus;
  requestedById: string | null;
  createdAt: string;
  updatedAt: string;
  members: apiDmMember[];
};

export type ApiDmMessage = {
  id: string;
  dmId: string;
  senderId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  sender: ApiDmUser;
};

export type ApiDmDetail = {
  id: string;
  status: DmStatus;
  requestedById: string | null;
  createdAt: string;
  updatedAt: string;
  other: ApiDmUser | null;
};

export function fetchDm(dmId: string): Promise<ApiDmDetail> {
  return authFetchApi<ApiDmDetail>(`/dms/${dmId}`);
}

export function fetchMyDms(): Promise<ApiDmListItem[]> {
  return authFetchApi<ApiDmListItem[]>('/dms');
}

export function fetchDmRequests(): Promise<ApiDmRequestItem[]> {
  return authFetchApi<ApiDmRequestItem[]>('/dms/requests');
}

export function openOrGetDm(otherUserId: string): Promise<ApiDm> {
  return authFetchApi<ApiDm>('/dms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otherUserId }),
  });
}

export function acceptDm(dmId: string): Promise<ApiDm> {
  return authFetchApi<ApiDm>(`/dms/${dmId}/accept`, { method: 'POST' });
}

export function declineDm(dmId: string): Promise<ApiDm> {
  return authFetchApi<ApiDm>(`/dms/${dmId}/decline`, { method: 'POST' });
}

export function fetchDmMessages(dmId: string): Promise<ApiDmMessage[]> {
  return authFetchApi<ApiDmMessage[]>(`/dms/${dmId}/messages`);
}

export function sendDmMessage(
  dmId: string,
  body: string,
): Promise<ApiDmMessage> {
  return authFetchApi<ApiDmMessage>(`/dms/${dmId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
}
export function markDmRead(
  dmId: string,
): Promise<{ lastReadAt: string; unread: false }> {
  return authFetchApi(`/dms/${dmId}/read`, { method: 'POST' });
}
