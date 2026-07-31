'use client';
import { MoodNapkin } from '@/components/recommendations/MoodNapkin';
import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
  fieldHintClassName,
  formLegendClassName,
} from '@/lib/form';
import { napkinTopicInputClassName } from '@/lib/napkinFont';
import {
  closeRoom,
  fetchRoom,
  parseTopicTags,
  updateRoom,
  type ApiRoom,
  type RoomVisibility,
} from '@/lib/rooms';
import { ChevronLeft, Hash, KeyRound, Loader2, Music2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { markNoticeSeen } from '@/lib/roomNoticeStorage';

export default function RoomSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = typeof params.id === 'string' ? params.id : '';
  const { user, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [topicTagsText, setTopicTagsText] = useState('');
  const topicPreview = useMemo(
    () => parseTopicTags(topicTagsText).slice(0, 2),
    [topicTagsText],
  );

  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/rooms/${roomId}/settings`);
    }
  }, [authLoading, user, router, roomId]);

  useEffect(() => {
    if (!user || !roomId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const room = await fetchRoom(roomId);
        if (cancelled) return;
        if (room.ownerId !== user.id) {
          router.replace(`/rooms/${roomId}`);
          return;
        }
        setRoom(room);
        setName(room.name);
        setDescription(room.description ?? '');
        setVisibility(room.visibility === 'private' ? 'private' : 'public');
        setTopicTagsText(room.topicTags.join(' '));
        setPasswordHint(room.passwordHint ?? '');
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : '방을 불러오지 못했어요.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, roomId, router]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('방 이름을 입력해주세요.');
      return;
    }
    setPending(true);
    setError('');
    try {
      // hash는 API에 안 옴 · 이미 private면 비번 있다고 봄
      const alreadyPrivate = room?.visibility === 'private';
      if (visibility === 'private' && !password.trim() && !alreadyPrivate) {
        setError('비공개 방은 비밀번호가 필요해요.');
        return;
      }
      const updated = await updateRoom(roomId, {
        name: trimmed,
        description: description.trim() || null,
        topicTags: parseTopicTags(topicTagsText),
        visibility,
        ...(visibility === 'private' && password.trim()
          ? { password: password.trim() }
          : {}),
        ...(visibility === 'private'
          ? { passwordHint: passwordHint.trim() || null }
          : { passwordHint: null }),
      });
      setRoom(updated);
      if (user?.id) {
        markNoticeSeen(user.id, updated.id, updated.description);
      }
      setPassword('');
      router.replace(`/rooms/${roomId}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '방 수정에 실패했습니다.',
      );
    } finally {
      setPending(false);
    }
  }

  async function confirmClose() {
    if (closing) return;
    setClosing(true);
    setError('');
    try {
      await closeRoom(roomId);
      setCloseOpen(false);
      router.replace('/rooms');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '방 닫기에 실패했습니다.',
      );
    } finally {
      setClosing(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }
  if (!room) {
    return (
      <main className={`${authPageClassName} gap-4`}>
        <p className={fieldErrorClassName}>{error || '방을 찾을 수 없어요.'}</p>
        <Link
          href="/rooms"
          className="text-sm text-brand-primary transition-colors hover:text-brand-primary/80">
          방 목록
        </Link>
      </main>
    );
  }
  return (
    <main className={`${authPageClassName} gap-6`}>
      <Link
        href={`/rooms/${roomId}`}
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80">
        <ChevronLeft className="size-4" aria-hidden />
        채팅으로
      </Link>
      <h1 className={authTitleClassName}>방 설정</h1>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <PillInput
          label="방 이름"
          name="name"
          value={name}
          onChange={setName}
          icon={Music2}
          maxLength={40}
          required
        />
        <PillTextarea
          label="방 공지 · 설명 (선택)"
          name="description"
          value={description}
          onChange={setDescription}
          maxLength={200}
          rows={3}
          hint="채팅 헤더 📣에 그대로 보여요 · 방장만 수정"
        />
        <div>
          <label htmlFor="topicTags" className={formLegendClassName}>
            태그 (선택)
          </label>
          <input
            id="topicTags"
            name="topicTags"
            type="text"
            value={topicTagsText}
            onChange={(e) => setTopicTagsText(e.target.value)}
            maxLength={80}
            placeholder="재즈 새벽 드라이브"
            aria-describedby="topicTags-hint"
            className={`${napkinTopicInputClassName} mt-1.5`}
          />
          {topicPreview.length > 0 ? (
            <MoodNapkin
              moods={topicPreview}
              size="room"
              className="mt-2 justify-start"
            />
          ) : null}
          <p id="topicTags-hint" className={`${fieldHintClassName} mt-1.5`}>
            공백으로 구분 · 최대 8개 · 목록엔 손글씨 2개 · 있으면 설명 대신
          </p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="px-1 text-[12px] font-semibold text-neutral-400">
            공개 여부
          </legend>
          <div className="flex overflow-hidden rounded-full border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.65)]">
            {(
              [
                { value: 'public', label: '공개' },
                { value: 'private', label: '비공개' },
              ] as const
            ).map((opt) => {
              const on = visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    on
                      ? 'bg-brand-primary text-[color:var(--color-lp-ink)]'
                      : 'text-[#a89880] hover:bg-[rgb(201_166_107/0.1)]'
                  }`}>
                  {opt.label}
                </button>
              );
            })}
          </div>
          {visibility === 'private' ? (
            <div className="flex flex-col gap-3">
              <PillInput
                label="비밀번호"
                name="password"
                type="password"
                value={password}
                onChange={setPassword}
                icon={KeyRound}
                maxLength={64}
                showPasswordToggle
                hint={
                  room?.passwordHint != null || room?.visibility === 'private'
                    ? '비워 두면 기존 비밀번호 유지'
                    : '비공개 전환 시 필수'
                }
              />
              <PillInput
                label="힌트 (선택)"
                name="passwordHint"
                value={passwordHint}
                onChange={setPasswordHint}
                icon={Hash}
                maxLength={40}
                hint="입장 화면에 작게 보여요 · 비밀번호 그대로 쓰지 마세요"
              />
            </div>
          ) : null}
        </fieldset>
        {error ? <p className={fieldErrorClassName}>{error}</p> : null}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[12px] font-semibold text-neutral-400">
            멤버
          </h2>
          <p className="rounded-2xl border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)] px-4 py-3 text-[13px] leading-relaxed text-[#a89880]">
            내보내기·방장 넘기기는 채팅이나 멤버 목록에서 닉을 탭하세요.
          </p>
        </section>
        <button
          type="submit"
          disabled={pending}
          className={authSubmitClassName}>
          {pending ? '저장 중…' : '저장'}
        </button>
      </form>

      <section className="flex w-full flex-col gap-2">
        <h2 className="px-1 text-[12px] font-semibold text-neutral-400">
          위험 구역
        </h2>
        <p className="px-1 text-[12px] text-neutral-400">
          {room.memberCount <= 1
            ? '혼자 있는 방은 닫으면 목록에서 사라져요.'
            : '방을 닫으면 멤버도 더 이상 들어올 수 없어요. 다른 멤버에게 방장을 넘기려면 닉을 탭하세요.'}
        </p>
        <button
          type="button"
          disabled={closing}
          onClick={() => setCloseOpen(true)}
          className="rounded-full border border-red-400/35 bg-[rgb(42_36_30/0.65)] px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-[rgb(208_128_112/0.12)] disabled:opacity-50">
          방 닫기
        </button>
      </section>

      <FeedDialog
        open={closeOpen}
        title="이 방을 닫을까요?"
        description="닫힌 방은 목록·입장에서 사라져요. 대화 기록은 서버에 남아요."
        confirmLabel="방 닫기"
        pendingLabel="닫는 중…"
        isPending={closing}
        onClose={() => !closing && setCloseOpen(false)}
        onConfirm={() => void confirmClose()}
      />
    </main>
  );
}
