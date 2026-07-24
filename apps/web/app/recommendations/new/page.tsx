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
  fieldHintClassName,
} from '@/lib/form';
import {
  napkinHandClassName,
  napkinMoodInputClassName,
} from '@/lib/napkinFont';
import {
  isValidMood,
  MAX_MOOD_LEN,
  MAX_MOODS,
  MIN_MOODS,
  MOODS,
} from '@/lib/moods';
import { buildLoginHref } from '@/lib/redirect';
import {
  MAX_ARTIST_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/recommendationFields';
import {
  ChevronLeftIcon,
  Info,
  Link2,
  Loader2,
  Music2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useState } from 'react';

const NEW_PATH = '/recommendations/new';

type FormState = {
  message?: string;
  moodError?: boolean;
};

export default function NewRecommendationPage() {
  const router = useRouter();
  const embedUrlNoticeId = useId();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [customMood, setCustomMood] = useState('');

  useEffect(() => {
    if (!getApiAccessToken()) {
      router.replace(buildLoginHref(NEW_PATH));
    }
  }, [router]);

  function toggleMood(mood: string) {
    setSelectedMoods((prev) => {
      if (prev.includes(mood)) return prev.filter((m) => m !== mood);
      if (prev.length >= MAX_MOODS) return prev;
      return [...prev, mood];
    });
  }

  function commitCustomMood() {
    const t = customMood.trim();
    if (!isValidMood(t)) return;
    setSelectedMoods((prev) => {
      if (prev.includes(t)) return prev;
      if (prev.length >= MAX_MOODS) return prev;
      return [...prev, t];
    });
    setCustomMood('');
  }

  async function submitRecommendation(
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const moods = formData.getAll('moods') as string[];
    if (moods.length < MIN_MOODS || moods.length > MAX_MOODS) {
      return {
        message: `무드를 ${MIN_MOODS}~${MAX_MOODS}개 선택해주세요.`,
        moodError: true,
      };
    }
    if (!moods.every(isValidMood)) {
      return {
        message: '무드는 1~8자로 입력해주세요.',
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

  const [state, formAction, isPending] = useActionState(
    submitRecommendation,
    {},
  );

  return (
    <main className={authPageClassName}>
      <Link
        href="/recommendations"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        피드로 돌아가기
      </Link>

      <header className="mb-8 text-center">
        <h1 className={`${authTitleClassName}`}>추천 올리기</h1>
        <p
          className={`${napkinHandClassName} mx-auto mt-2.5 max-w-[20rem] text-[1.15rem] leading-snug text-[#c9a66b]`}
          style={{
            transform: 'rotate(-0.8deg)',
            transformOrigin: 'center',
          }}>
          켜진 조명 아래, 오늘 고른 한 곡을 남겨 주세요.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <PillInput
            label="재생 URL"
            name="embedUrl"
            type="text"
            required
            icon={Link2}
            hint="YouTube · Spotify 공유 링크 (Apple Music — 준비 중)"
            additionalDescribedBy={embedUrlNoticeId}
          />
          <p
            id={embedUrlNoticeId}
            className={`${fieldHintClassName} flex gap-1.5`}>
            <Info
              className="size-4 shrink-0 mt-0.5 text-[#a89880]"
              aria-hidden
            />
            <span>
              YouTube는 업로더 정책으로 앱 안 재생이 막혀 있을 수 있어요. 추천
              글은 그대로 올라가고, 그때는 YouTube에서 들을 수 있어요. Apple
              Music 링크 지원은 준비 중이에요.
            </span>
          </p>
        </div>
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
            {`무드를 ${MIN_MOODS}~${MAX_MOODS}개 선택해주세요.`}
          </legend>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            {MOODS.map((mood) => (
              <MoodPicker
                key={mood}
                mood={mood}
                selected={selectedMoods.includes(mood)}
                onToggle={() => toggleMood(mood)}
              />
            ))}
            {selectedMoods
              .filter((m) => !(MOODS as readonly string[]).includes(m))
              .map((mood) => (
                <MoodPicker
                  key={mood}
                  mood={mood}
                  selected
                  onToggle={() => toggleMood(mood)}
                />
              ))}
            <input
              type="text"
              value={customMood}
              maxLength={MAX_MOOD_LEN}
              placeholder="직접 쓰기"
              aria-label="무드 직접 입력"
              onChange={(e) => setCustomMood(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  commitCustomMood();
                }
              }}
              className={napkinMoodInputClassName}
            />
          </div>
          <p className={`${fieldHintClassName} mt-1.5`}>
            직접 쓴 뒤 Enter · 최대 {MAX_MOOD_LEN}자
          </p>
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
