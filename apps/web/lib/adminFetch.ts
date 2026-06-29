import { authFetchApi, authFetchApiVoid } from './authFetch';

export function adminFetchJson<T>(path: string, init?: RequestInit) {
  return authFetchApi<T>(`/admin${path}`, init);
}

export function adminFetchVoid(path: string, init?: RequestInit) {
  return authFetchApiVoid(`/admin${path}`, init);
}
