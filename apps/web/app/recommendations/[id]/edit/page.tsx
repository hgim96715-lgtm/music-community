'use client';

import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { MoodPicker } from '@/components/recommendations/MoodPicker';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchRecommendations, updateRecommendation } from '@/lib/api';
import { canEditRecommendationToday } from '@/lib/date';
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
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

export default function EditRecommendationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const embedUrlNoticeId = useId();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [moodError, setMoodError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [customMood, setCustomMood] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(buildLoginHref(`/recommendations/${id}/edit`));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const list = await fetchRecommendations(user.id);
        const rec = list.find((r) => r.id === id);
        if (!rec || rec.author.id !== user.id) {
          router.replace('/recommendations');
          return;
        }
        if (!canEditRecommendationToday(rec.createdAt)) {
          router.replace('/recommendations');
          return;
        }
        if (cancelled) return;
        setTitle(rec.title);
        setArtist(rec.artist);
        setEmbedUrl(rec.embedUrl);
        setReason(rec.reason);
        setSelectedMoods(rec.moods);
      } catch {
        if (!cancelled) router.replace('/recommendations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, id, router]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMoodError(false);

    if (selectedMoods.length < MIN_MOODS || selectedMoods.length > MAX_MOODS) {
      setError(`무드를 ${MIN_MOODS}~${MAX_MOODS}개 선택해주세요.`);
      setMoodError(true);
      return;
    }
    if (!selectedMoods.every(isValidMood)) {
      setError('무드는 1~8자로 입력해주세요.');
      setMoodError(true);
      return;
    }

    setSaving(true);
    try {
      await updateRecommendation(id, {
        title: title.trim(),
        artist: artist.trim(),
        embedUrl: embedUrl.trim(),
        reason: reason.trim(),
        moods: selectedMoods,
      });
      router.push('/recommendations');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '추천 수정에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={authPageClassName}>
      <Link
        href="/recommendations"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        피드로 돌아가기
      </Link>

      <header className="mb-8 text-center">
        <h1 className={authTitleClassName}>추천 수정</h1>
        <p
          className={`${napkinHandClassName} mx-auto mt-2.5 max-w-[18rem] text-[1.15rem] leading-snug text-[#c9a66b]`}
          style={{
            transform: 'rotate(-0.8deg)',
            transformOrigin: 'center',
          }}>
          오늘 남긴 한 곡, 손글씨만 다시 고쳐요.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <PillInput
            label="재생 URL"
            name="embedUrl"
            type="text"
            required
            icon={Link2}
            value={embedUrl}
            onChange={setEmbedUrl}
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
              YouTube는 업로더 정책으로 앱 안 재생이 막혀 있을 수 있어요.
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
          value={title}
          onChange={setTitle}
          hint={`최대 ${MAX_TITLE_LENGTH}자`}
        />
        <PillInput
          label="아티스트"
          name="artist"
          type="text"
          required
          maxLength={MAX_ARTIST_LENGTH}
          icon={User}
          value={artist}
          onChange={setArtist}
          hint={`최대 ${MAX_ARTIST_LENGTH}자`}
        />
        <PillTextarea
          label="추천 이유"
          name="reason"
          required
          maxLength={200}
          rows={4}
          value={reason}
          onChange={setReason}
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
          {moodError && error ? (
            <p className={fieldErrorClassName} role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}
        </fieldset>
        {!moodError && error ? (
          <p className={fieldErrorClassName} role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className={`${authSubmitClassName} mt-2`}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? '저장 중…' : '수정 완료'}
        </button>
      </form>
    </main>
  );
}
