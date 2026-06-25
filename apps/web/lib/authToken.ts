const STORAGE_KEY = 'mc_access_token';

export function getApiAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function removeApiAccessToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
