"use server";
import { ApiRecommendation } from "@/lib/apiTypes";
import { getApiAccessToken } from "@/lib/getApiAccessToken";
import { mapRecommendation } from "@/lib/mapRecommendation";
import type { CreateRecommendationBody, Recommendation } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createRecommendation(
  body: CreateRecommendationBody,
): Promise<Recommendation> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!");
  }

  const token = await getApiAccessToken();
  if (!token) {
    throw new Error("로그인 후 이용해주세요.");
  }
  const res = await fetch(`${API_URL}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `API 요청실패 POST /recommendations 응답코드: ${res.status}`,
    );
  }

  const data = (await res.json()) as ApiRecommendation;
  return mapRecommendation(data);
}
