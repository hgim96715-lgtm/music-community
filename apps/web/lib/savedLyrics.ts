import type {
  ApiSavedLyric,
  ApiSavedLyricBody,
  UpdateSavedLyricBody,
} from './apiTypes';
import { authFetchApi, authFetchApiVoid } from './authFetch';

export function fetchSavedLyrics(): Promise<ApiSavedLyric[]> {
  return authFetchApi<ApiSavedLyric[]>('/saved-lyrics');
}

export function createSavedLyric(
  body: ApiSavedLyricBody,
): Promise<ApiSavedLyric> {
  return authFetchApi<ApiSavedLyric>('/saved-lyrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function patchSavedLyric(
  id: string,
  body: UpdateSavedLyricBody,
): Promise<ApiSavedLyric> {
  return authFetchApi<ApiSavedLyric>(`/saved-lyrics/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deleteSavedLyric(id: string) {
  return authFetchApiVoid(`/saved-lyrics/${id}`, { method: 'DELETE' });
}
