/** Bearer 붙이는 fetch — POST /recommendations 등 */

import { getApiAccessToken } from './authToken';
import { getApiBaseUrl } from './fetchApi';

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
