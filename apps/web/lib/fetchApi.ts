/**
 * Nest API 공통 fetch 유틸 (Bearer 없음).
 * 로그인 필요한 요청은 authFetch.ts 의 authFetchApi 를 쓴다.
 */

/** NEXT_PUBLIC_API_URL — 끝 슬래시 제거 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다. 확인해주세요!',
    );
  }
  return url.replace(/\/$/, '');
}

/**
 * res.ok 가 아니면 Nest 에러 body 의 message 를 파싱해 throw.
 * authFetchApi 에서도 재사용
 */
export async function throwIfNotOk(res: Response, fallback: string) {
  if (res.ok) return;
  const error = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(error?.message)
    ? error.message[0]
    : error?.message;
  throw new Error(
    message ?? `API ${fallback} 요청 실패: ${res.status} ${res.statusText}`,
  );
}

/** GET /recommendations, POST /auth/login 등 — JSON 응답을 T 로 반환 */
export async function fetchApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, init);
  } catch {
    throw new Error(
      'API 서버에 연결할 수 없습니다. apps/api dev(3030) 실행·CORS·NEXT_PUBLIC_API_URL을 확인해주세요.',
    );
  }
  await throwIfNotOk(res, path);
  return (await res.json()) as Promise<T>;
}
