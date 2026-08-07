import { authFetchApi } from './authFetch';
import type { components } from '../generated/api';

type Schemas = components['schemas'];

export type DmStatus = Schemas['DmListItemResponseDto']['status'];

export type ApiDmUser = Omit<Schemas['AuthorSnippetDto'], 'image'> & {
  image: string | null;
};

export type ApiDmLastMessage = Schemas['DmLastMessageDto'];

export type ApiDmListItem = Omit<
  Schemas['DmListItemResponseDto'],
  'other' | 'lastMessage'
> & {
  other: ApiDmUser | null;
  lastMessage: ApiDmLastMessage | null;
};

export type ApiDmRequestItem = Omit<
  Schemas['DmRequestItemResponseDto'],
  'other' | 'requestedById'
> & {
  requestedById: string | null;
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

export type ApiDmMessage = Omit<Schemas['DmMessageResponseDto'], 'sender'> & {
  sender: ApiDmUser;
};

export type ApiDmDetail = Omit<
  Schemas['DmDetailResponseDto'],
  'other' | 'requestedById'
> & {
  requestedById: string | null;
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
