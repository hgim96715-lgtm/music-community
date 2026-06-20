import { ApiRecommendation } from "./apiTypes";
import { mapRecommendation, mapRecommendations } from "./mapRecommendation";
import type { CreateRecommendationBody, Recommendation } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchRecommendation(): Promise<Recommendation[]> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!");
  }

  const res = await fetch(`${API_URL}/recommendations`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(
      `API 요청실패 GET /recommendations 응답코드: ${res.status}`,
    );
  }

  const data = (await res.json()) as ApiRecommendation[];
  return mapRecommendations(data);
}

export async function createRecommendation(
  body: CreateRecommendationBody,
): Promise<Recommendation> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!");
  }
  const res = await fetch(`${API_URL}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
