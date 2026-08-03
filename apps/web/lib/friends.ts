import type { ApiFriendRequests, ApiFriendship } from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';

/** GET /friends — 맞친구 목록 */
export async function fetchFriends(): Promise<ApiFriendship[]> {
  return authFetchApi<ApiFriendship[]>('/friends');
}

/** GET /friends/requests — 받은 · 보낸 친구 요청 목록 */
export function fetchFriendRequests(): Promise<ApiFriendRequests> {
  return authFetchApi<ApiFriendRequests>('/friends/requests');
}

/** POST /friends/requests — 친구 요청 보내기 */
export function createFriendRequest(userId: string): Promise<ApiFriendship> {
  return authFetchApi<ApiFriendship>('/friends/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

/** PATCH /friends/requests/:id — 수락·거절 */
export function respondFriendRequest(
  friendshipId: string,
  action: 'accept' | 'decline',
): Promise<ApiFriendship> {
  return authFetchApi<ApiFriendship>(`/friends/requests/${friendshipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}

/** DELETE /friends/:userId — 요청 취소 · 친구 삭제 */
export function removeFriend(otherUserId: string): Promise<void> {
  return authFetchApiVoid(`/friends/${otherUserId}`, { method: 'DELETE' });
}
