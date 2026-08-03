import type {
  ApiSavedCard,
  ApiSavedCardCustomization,
  CreateSavedCardBody,
} from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';

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
