'use client';

import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { MoodPicker } from '@/components/recommendations/MoodPicker';
import { authFetchApi } from '@/lib/authFetch';
import { getApiAccessToken } from '@/lib/authToken';
import {
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
  formLegendClassName,
} from '@/lib/form';
import { MAX_MOODS, MIN_MOODS, MOODS, type Mood } from '@/lib/moods';
import { buildLoginHref } from '@/lib/redirect';
import {
  MAX_ARTIST_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/recommendationFields';
import { ChevronLeftIcon, Link2, Loader2, Music2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

const NEW_PATH = '/recommendations/new';

type FormState = {
  message?: string;
  moodError?: boolean;
};

export default function NewRecommendationPage() {
  const router = useRouter();
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);

  useEffect(() => {
    if (!getApiAccessToken()) {
      router.replace(buildLoginHref(NEW_PATH));
    }
  }, [router]);

  function toggleMood(mood: Mood) {
    setSelectedMoods((prev) => {
      if (prev.includes(mood)) return prev.filter((m) => m !== mood);
      if (prev.length >= MAX_MOODS) return prev;
      return [...prev, mood];
    });
  }

  async function submitRecommendation(
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const moods = formData.getAll('moods') as string[];
    if (moods.length < MIN_MOODS || moods.length > MAX_MOODS) {
      return {
        message: `${MIN_MOODS}~${MAX_MOODS}개의 분위기를 선택해주세요.`,
        moodError: true,
      };
    }
    try {
      await authFetchApi('/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title') as string,
          artist: formData.get('artist') as string,
          embedUrl: formData.get('embedUrl') as string,
          reason: formData.get('reason') as string,
          moods,
        }),
      });
      router.push('/recommendations');
      return {};
    } catch (error) {
      return {
        message:
          error instanceof Error ? error.message : '추천 등록에 실패했습니다.',
      };
    }
  }

  const [state, formAction, isPending] = useActionState(submitRecommendation, {});

  return (
    <main className={authPageClassName}>
      <Link
        href="/recommendations"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        피드로 돌아가기
      </Link>

      <header className="mb-8">
        <h1 className={`${authTitleClassName} text-center`}>추천 올리기</h1>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <PillInput
          label="재생 URL"
          name="embedUrl"
          type="text"
          required
          icon={Link2}
          hint="YouTube·Spotify 공유 링크 붙여넣기"
        />
        <PillInput
          label="곡 제목"
          name="title"
          type="text"
          required
          maxLength={MAX_TITLE_LENGTH}
          icon={Music2}
          hint={`최대 ${MAX_TITLE_LENGTH}자`}
        />
        <PillInput
          label="아티스트"
          name="artist"
          type="text"
          required
          maxLength={MAX_ARTIST_LENGTH}
          icon={User}
          hint={`최대 ${MAX_ARTIST_LENGTH}자`}
        />
        <PillTextarea
          label="추천 이유"
          name="reason"
          required
          maxLength={200}
          rows={4}
          hint="최대 200자"
        />
        <fieldset>
          <legend className={formLegendClassName}>
            분위기 ({MIN_MOODS}~{MAX_MOODS}개)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <MoodPicker
                key={mood}
                mood={mood}
                selected={selectedMoods.includes(mood)}
                onToggle={() => toggleMood(mood)}
              />
            ))}
          </div>
          {selectedMoods.map((mood) => (
            <input key={mood} type="hidden" name="moods" value={mood} />
          ))}
          {state.moodError && state.message ? (
            <p className={fieldErrorClassName} role="alert" aria-live="polite">
              {state.message}
            </p>
          ) : null}
        </fieldset>
        {!state.moodError && state.message ? (
          <p className={fieldErrorClassName} role="alert" aria-live="polite">
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className={`${authSubmitClassName} mt-2`}>
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isPending ? '올리는 중…' : '추천 올리기'}
        </button>
      </form>
    </main>
  );
}
