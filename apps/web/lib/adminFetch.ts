import "server-only";
import { getApiAccessToken } from "./getApiAccessToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AdminFetchInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function AdminFetch(path: string, init: AdminFetchInit = {}) {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL이 설정되지 않았습니다. env 확인해주세요!",
    );
  }
  const token = await getApiAccessToken();
  if (!token) {
    throw new Error("로그인 후 이용해주세요.");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const method = init.method ?? "GET";
    throw new Error(`API 요청실패 ${method} ${path} 응답코드: ${res.status}`);
  }

  return res;
}

export async function adminFetchJson<T>(
  path: string,
  init?: AdminFetchInit,
): Promise<T> {
  const res = await AdminFetch(path, init);
  return res.json() as Promise<T>;
}

export async function adminFetchVoid(path: string, init?: AdminFetchInit) {
  await AdminFetch(path, init);
}
