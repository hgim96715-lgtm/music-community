import { authFetchJson, type AuthFetchInit } from './authFetch';

type AdminFetchInit = AuthFetchInit;

export async function adminFetchJson<T>(
  path: string,
  init?: AdminFetchInit,
): Promise<T> {
  return authFetchJson<T>(path, init);
}

export async function adminFetchVoid(path: string, init?: AdminFetchInit) {
  await authFetchJson<void>(path, init);
}
