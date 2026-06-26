/** Bearer 붙이는 fetch — POST /recommendations 등 */

import { getApiAccessToken } from './authToken';
import { getApiBaseUrl, throwIfNotOk } from './fetchApi';

export async function authFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getApiAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
}

/** Bearer + JSON — fetchApi 와 같은 에러 처리 */
export async function authFetchApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await authFetch(path, init);
  await throwIfNotOk(res, path);
  return (await res.json()) as Promise<T>;
}

export async function authFetchApiVoid(
  path: string,
  init?: RequestInit,
): Promise<void> {
  const res = await authFetch(path, init);
  await throwIfNotOk(res, path);
}
