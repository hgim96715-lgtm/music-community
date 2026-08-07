import type { ApiComment, ApiRecommendation } from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';
import { fetchApi } from './fetchApi';
import { mapRecommendations } from '../mapRecommendation';
import type { Recommendation } from '../types';

export type RecommendationsPage = {
  items: Recommendation[];
  nextCursor: string | null;
};

type FetchRecommendationsOpts = {
  currentUserId?: string;
  scope?: 'recent' | 'older' | 'all';
  feed?: 'all' | 'friends';
  cursor?: string;
  limit?: number;
};

/** 공개 피드 — Bearer 없음 · 기본은 전체(공유 시트·수정 폼 호환) */
export async function fetchRecommendations(
  currentUserId?: string,
): Promise<Recommendation[]> {
  const page = await fetchRecommendationsPage({ currentUserId });
  return page.items;
}

export async function fetchRecommendationsPage(
  opts: FetchRecommendationsOpts = {},
): Promise<RecommendationsPage> {
  const params = new URLSearchParams();
  if (opts.scope) params.set('scope', opts.scope);
  if (opts.feed && opts.feed !== 'all') params.set('feed', opts.feed);
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit != null) params.set('limit', opts.limit.toString());
  const qs = params.toString();
  const path = qs ? `/recommendations?${qs}` : '/recommendations';

  const data =
    opts.feed === 'friends'
      ? await authFetchApi<{
          items: ApiRecommendation[];
          nextCursor: string | null;
        }>(path, { cache: 'no-store' })
      : await fetchApi<{
          items: ApiRecommendation[];
          nextCursor: string | null;
        }>(path, {
          credentials: 'include',
          cache: 'no-store',
        });
  return {
    items: mapRecommendations(data.items, opts.currentUserId),
    nextCursor: data.nextCursor,
  };
}
/** PATCH /recommendations/:id — 본인 · 당일(KST)만 */
export function updateRecommendation(
  id: string,
  body: {
    title?: string;
    artist?: string;
    embedUrl?: string;
    reason?: string;
    moods?: string[];
  },
): Promise<ApiRecommendation> {
  return authFetchApi<ApiRecommendation>(`/recommendations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** DELETE /recommendations/:id — 본인 글만 삭제 */
export function deleteRecommendation(id: string) {
  return authFetchApiVoid(`/recommendations/${id}`, { method: 'DELETE' });
}

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
  parentId?: string,
): Promise<ApiComment> {
  return authFetchApi<ApiComment>(
    `/recommendations/${recommendationId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body,
        ...(parentId ? { parentId } : {}),
      }),
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
