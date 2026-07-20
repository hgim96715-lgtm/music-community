import {
  ApiAuthResponse,
  ApiAuthUser,
  ApiComment,
  ApiFriendRequests,
  ApiFriendship,
  ApiPublicUser,
  ApiRecommendation,
  ApiSavedCard,
  ApiSavedCardCustomization,
  CreateSavedCardBody,
} from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';
import { removeApiAccessToken, setApiAccessToken } from './authToken';
import { fetchApi } from './fetchApi';
import { mapRecommendations } from './mapRecommendation';
import { Recommendation } from './types';

/** 공개 피드 — Bearer 없음 */
export async function fetchRecommendations(
  currentUserId?: string,
): Promise<Recommendation[]> {
  const data = await fetchApi<ApiRecommendation[]>('/recommendations', {
    credentials: 'include',
    cache: 'no-store',
  });
  return mapRecommendations(data, currentUserId);
}

async function postAuth(
  path: 'login' | 'register',
  body: Record<string, string>,
): Promise<ApiAuthResponse> {
  const data = await fetchApi<ApiAuthResponse>(`/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  setApiAccessToken(data.accessToken);
  return data;
}

export async function login(email: string, password: string) {
  return postAuth('login', { email: email.trim(), password });
}

export function register(email: string, password: string, nickname: string) {
  return postAuth('register', {
    email: email.trim(),
    password,
    nickname: nickname.trim(),
  });
}

/** Nest GET /auth/me — 새로고침 후 user 캐시 갱신 */
export async function fetchMe(): Promise<ApiAuthUser> {
  return authFetchApi<ApiAuthUser>('/auth/me');
}

/** 로그아웃 · 401 시 */
export function clearAuthStorage(): void {
  removeApiAccessToken();
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  const q = encodeURIComponent(email.trim());
  const data = await fetchApi<{ available: boolean }>(
    `/auth/email-available?email=${q}`,
  );
  return data.available;
}

export async function checkNicknameAvailable(
  nickname: string,
): Promise<boolean> {
  const q = encodeURIComponent(nickname.trim());
  const data = await fetchApi<{ available: boolean }>(
    `/auth/nickname-available?nickname=${q}`,
  );
  return data.available;
}

/** DELETE /recommendations/:id — 본인 글만 삭제 */
export function deleteRecommendation(id: string) {
  return authFetchApiVoid(`/recommendations/${id}`, { method: 'DELETE' });
}

// Users
export async function fetchUserProfile(): Promise<ApiAuthUser> {
  return authFetchApi<ApiAuthUser>('/users/me');
}

/** PATCH /users/me — 닉네임 · bio */
export async function patchUserProfile(body: {
  nickname?: string;
  bio?: string | null;
}): Promise<ApiAuthUser> {
  return authFetchApi<ApiAuthUser>('/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// saved-cards
export async function fetchSavedCards(): Promise<ApiSavedCard[]> {
  return authFetchApi<ApiSavedCard[]>('/saved-cards');
}
/** POST /saved-cards — 본인 글만 · 중복 409 */
export async function createSavedCard(
  body: CreateSavedCardBody,
): Promise<ApiSavedCard> {
  return authFetchApi<ApiSavedCard>('/saved-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** PATCH /saved-cards/:id — customization만 · 카드 소유자만 */
export async function patchSavedCard(
  id: string,
  customization: ApiSavedCardCustomization,
): Promise<ApiSavedCard> {
  return authFetchApi<ApiSavedCard>(`/saved-cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customization }),
  });
}
/** PATCH /saved-cards/:id/shelf — Top 1~3 | null(책장) */
export function patchSavedCardShelf(
  id: string,
  shelfRank: 1 | 2 | 3 | null,
): Promise<ApiSavedCard> {
  return authFetchApi<ApiSavedCard>(`/saved-cards/${id}/shelf`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shelfRank }),
  });
}

/** DELETE /saved-cards/:id — 204 */
export function deleteSavedCard(id: string) {
  return authFetchApiVoid(`/saved-cards/${id}`, { method: 'DELETE' });
}

// comments

export async function fetchComments(recommendationId: string) {
  return fetchApi<ApiComment[]>(
    `/recommendations/${recommendationId}/comments`,
    {
      cache: 'no-store',
    },
  );
}

/** POST /recommendations/:id/comments — 로그인 필요 */
export async function createComment(
  recommendationId: string,
  body: string,
): Promise<ApiComment> {
  return authFetchApi<ApiComment>(
    `/recommendations/${recommendationId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    },
  );
}

/** PATCH /recommendations/:id/comments/:commentId — 본인만 */
export async function updateComment(
  recommendationId: string,
  commentId: string,
  body: string,
): Promise<ApiComment> {
  return authFetchApi<ApiComment>(
    `/recommendations/${recommendationId}/comments/${commentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    },
  );
}

/** DELETE /recommendations/:id/comments/:commentId — 본인·관리자 · 204 */
export function deleteComment(
  recommendationId: string,
  commentId: string,
): Promise<void> {
  return authFetchApiVoid(
    `/recommendations/${recommendationId}/comments/${commentId}`,
    { method: 'DELETE' },
  );
}

/** GET /friends — 맞친구 목록 */
export async function fetchFriends(): Promise<ApiFriendship[]> {
  return authFetchApi<ApiFriendship[]>('/friends');
}

/** GET /friends/requests  받은 · 보낸 친구 요청 목록 */
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

/** POST /users/:id/block — 차단 · 204 */
export function blockUser(userId: string): Promise<void> {
  return authFetchApiVoid(`/users/${userId}/block`, { method: 'POST' });
}

/** DELETE /users/:id/block — 차단 해제 · 204 */
export function unblockUser(userId: string): Promise<void> {
  return authFetchApiVoid(`/users/${userId}/block`, { method: 'DELETE' });
}
