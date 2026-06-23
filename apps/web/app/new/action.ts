'use server';

import { ApiRecommendation } from '@/lib/apiTypes';
import { getApiAccessToken } from '@/lib/getApiAccessToken';
import { MOODS, type Mood } from '@/lib/types';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type NewRecommendationFormState = { error?: string };

export async function createRecommendationAction(
  _prevState: NewRecommendationFormState,
  formData: FormData,
): Promise<NewRecommendationFormState> {
  const title = String(formData.get('title') ?? '').trim();
  const artist = String(formData.get('artist') ?? '').trim();
  const embedUrl = String(formData.get('embedUrl') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const moodsRaw = String(formData.get('moods') ?? '');
  const moods = moodsRaw
    .split(',')
    .map((m) => m.trim())
    .filter((m): m is Mood => MOODS.includes(m as Mood));

  if (moods.length === 0) {
    return { error: '분위기 태그를 1~3개 선택해주세요.' };
  }

  if (!API_URL) {
    return {
      error: 'NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!',
    };
  }

  const token = await getApiAccessToken();
  if (!token) {
    return { error: '로그인 후 이용해주세요.' };
  }

  const res = await fetch(`${API_URL}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, artist, embedUrl, reason, moods }),
  });

  if (!res.ok) {
    return {
      error: `API 요청실패 POST /recommendations 응답코드: ${res.status}`,
    };
  }

  (await res.json()) as ApiRecommendation;
  redirect('/');
}
