"use server";

import { getApiAccessToken } from "@/lib/getApiAccessToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ToggleLikeActionState = {
  error?: string;
  liked?: boolean;
  likeCount?: number;
};

export async function toggleLikeAction(
  _prevState: ToggleLikeActionState,
  formData: FormData,
): Promise<ToggleLikeActionState> {
  const recommendationId = String(
    formData.get("recommendationId") ?? "",
  ).trim();
  if (!recommendationId) {
    return { error: "추천 글 아이디가 없습니다." };
  }
  if (!API_URL) {
    return {
      error: "NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!",
    };
  }
  const token = await getApiAccessToken();
  if (!token) {
    return { error: "로그인 후 이용해주세요." };
  }
  const res = await fetch(
    `${API_URL}/recommendations/${recommendationId}/reactions`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    return { error: `좋아요 요청 실패 ${res.status}` };
  }
  const data = (await res.json()) as { liked: boolean; likeCount: number };
  return { liked: data.liked, likeCount: data.likeCount };
}
