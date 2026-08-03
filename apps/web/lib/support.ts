import type { ApiPublicNotice } from './apiTypes';
import { fetchApi } from './fetchApi';

/** POST /support/contact — 비로그인 OK */
export async function createSupportContact(body: {
  fromEmail: string;
  nickname?: string;
  subject: string;
  body: string;
}): Promise<{ ok: true }> {
  return fetchApi<{ ok: true }>('/support/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** GET /support/notices — 게시된 공지만 */
export function fetchPublishedNotices(): Promise<ApiPublicNotice[]> {
  return fetchApi<ApiPublicNotice[]>('/support/notices', { cache: 'no-store' });
}

/** GET /support/notices/:id */
export function fetchPublishedNotice(id: string): Promise<ApiPublicNotice> {
  return fetchApi<ApiPublicNotice>(`/support/notices/${id}`, {
    cache: 'no-store',
  });
}
