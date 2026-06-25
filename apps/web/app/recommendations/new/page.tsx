'use client';
import Link from 'next/link';
import { MAX_MOODS, MIN_MOODS, MOODS, type Mood } from '@/lib/moods';
import { ChevronLeftIcon, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';

type FormState = { message?: string };

async function submitStub(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const moods = formData.getAll('moods') as string[];
  if (moods.length < MIN_MOODS || moods.length > MAX_MOODS) {
    return { message: `${MIN_MOODS}~${MAX_MOODS}개의 분위기를 선택해주세요.` };
  }

  // TODO : POST 아직 미구현
  return { message: 'POST 아직 미구현' };
}

/** 폼 공통 class — /new 전용. 재사용 늘면 components/ui 또는 lib/form.ts 로 이동 */
const inputClassName =
  'mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm';

const labelClassName = 'text-sm font-medium';

/**====================================== */

export default function NewRecommendationPage() {
  const [state, formAction, isPending] = useActionState(submitStub, {});
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);

  function toggleMood(mood: Mood) {
    setSelectedMoods((prev) => {
      if (prev.includes(mood)) return prev.filter((m) => m !== mood);
      if (prev.length >= MAX_MOODS) return prev;
      return [...prev, mood];
    });
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/recommendations"
          className="flex items-center gap-1 text-sm text-neutral-600">
          <ChevronLeftIcon className="h-4 w-4" />
          피드로 돌아가기
        </Link>
        <h1 className="text-xl font-semibold">추천 올리기</h1>
      </header>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="embedUrl" className={labelClassName}>
            재생 URL
          </label>
          <input
            type="url"
            id="embedUrl"
            name="embedUrl"
            required
            placeholder="https://..."
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="title" className={labelClassName}>
            곡 제목
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="artist" className={labelClassName}>
            아티스트
          </label>
          <input
            type="text"
            id="artist"
            name="artist"
            required
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="reason" className={labelClassName}>
            추천 이유
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            maxLength={200}
            rows={4}
            className={inputClassName}
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">
            분위기 ({MIN_MOODS}~{MAX_MOODS}개)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => toggleMood(mood)}
                aria-pressed={selectedMoods.includes(mood)}
                className={
                  selectedMoods.includes(mood)
                    ? 'rounded-full bg-neutral-900 px-3 py-1 text-sm text-white'
                    : 'rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700'
                }>
                {mood}
              </button>
            ))}
          </div>
          {selectedMoods.map((mood) => (
            <input key={mood} type="hidden" name="moods" value={mood} />
          ))}
        </fieldset>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isPending ? '올리는 중…' : '추천 올리기'}
        </button>
        {state.message ? (
          <p className="text-sm text-red-500" aria-live="polite">
            {state.message}
          </p>
        ) : null}
      </form>
    </main>
  );
}
