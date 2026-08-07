import type {
  ApiAuthUser,
  ApiMyStats,
  ApiPublicUser,
  ApiSavedCard,
  ApiUserSearchPage,
  WithdrawResult,
} from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';
import { fetchApi } from './fetchApi';

export async function fetchUserProfile(): Promise<ApiAuthUser> {
  return authFetchApi<ApiAuthUser>('/users/me');
}

/** PATCH /users/me — 닉네임 · bio */
export async function patchUserProfile(body: {
  nickname?: string;
  bio?: string | null;
  albumVisibility?: 'private' | 'public';
}): Promise<ApiAuthUser> {
  return authFetchApi<ApiAuthUser>('/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** GET /users/me/stats — 주·월·누적 */
export async function fetchMyStats(): Promise<ApiMyStats> {
  return authFetchApi<ApiMyStats>('/users/me/stats');
}

/** GET /users/search?q= — 닉 검색 (최소 2글자) */
export function searchUsers(opts: {
  q: string;
  cursor?: string;
  limit?: number;
}): Promise<ApiUserSearchPage> {
  const sp = new URLSearchParams();
  sp.set('q', opts.q.trim());
  if (opts.cursor) sp.set('cursor', opts.cursor);
  if (opts.limit != null) sp.set('limit', opts.limit.toString());
  return authFetchApi<ApiUserSearchPage>(`/users/search?${sp.toString()}`);
}

/** GET /users/:id/block-status — 내가 차단했는지 */
export function fetchBlockStatus(
  userId: string,
): Promise<{ blockedByMe: boolean }> {
  return authFetchApi<{ blockedByMe: boolean }>(
    `/users/${userId}/block-status`,
  );
}

/** GET /users/:id — 공개 프로필 (게스트 OK) */
export function fetchPublicUser(userId: string): Promise<ApiPublicUser> {
  return fetchApi<ApiPublicUser>(`/users/${userId}`);
}

export type ApiPublicAlbum = {
  user: { id: string; nickname: string };
  items: ApiSavedCard[];
};

/** GET /users/:id/album — 공개 앨범 (게스트 OK · private면 403) */
export function fetchPublicAlbum(userId: string): Promise<ApiPublicAlbum> {
  return fetchApi<ApiPublicAlbum>(`/users/${userId}/album`);
}

/** POST /users/:id/block — 차단 · 204 */
export function blockUser(userId: string): Promise<void> {
  return authFetchApiVoid(`/users/${userId}/block`, { method: 'POST' });
}

/** DELETE /users/:id/block — 차단 해제 · 204 */
export function unblockUser(userId: string): Promise<void> {
  return authFetchApiVoid(`/users/${userId}/block`, { method: 'DELETE' });
}

/** POST /users/me/withdraw — 탈퇴 예약 */
export function withdrawMe(body: {
  confirm: string;
  password?: string;
}): Promise<WithdrawResult> {
  return authFetchApi<WithdrawResult>('/users/me/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** POST /users/me/withdraw/cancel — 유예 중 취소 */
export function cancelWithdraw(): Promise<{ ok: true }> {
  return authFetchApi<{ ok: true }>('/users/me/withdraw/cancel', {
    method: 'POST',
  });
}
