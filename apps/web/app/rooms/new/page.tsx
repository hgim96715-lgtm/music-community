'use client';
import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
} from '@/lib/form';
import { createRoom, parseTopicTags, RoomVisibility } from '@/lib/rooms';
import { ChevronLeft, Hash, KeyRound, Loader2, Music2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewRoomPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const [topicTagsText, setTopicTagsText] = useState('');

  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/rooms/new');
    }
  }, [authLoading, user, router]);

  async function handleSubmit(
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('방 이름을 입력해주세요.');
      return;
    }
    if (visibility === 'private' && !password.trim()) {
      setError('비공개 방은 비밀번호가 있어야 합니다.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const room = await createRoom({
        name: trimmed,
        description: description.trim() || undefined,
        topicTags: parseTopicTags(topicTagsText),
        visibility,
        ...(visibility === 'private'
          ? {
              password: password.trim(),
              passwordHint: passwordHint.trim() || undefined,
            }
          : {}),
      });
      router.replace(`/rooms/${room.id}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '방 생성에 실패했습니다.',
      );
    } finally {
      setPending(false);
    }
  }
  if (authLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }
  return (
    <main className={`${authPageClassName} gap-6`}>
      <Link
        href="/rooms"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeft className="size-4" aria-hidden />방 목록
      </Link>
      <h1 className={authTitleClassName}>새 방</h1>
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
          label="설명 (선택)"
          name="description"
          value={description}
          onChange={setDescription}
          maxLength={200}
          rows={3}
        />
        <PillInput
          label="태그 (선택)"
          name="topicTags"
          value={topicTagsText}
          onChange={setTopicTagsText}
          icon={Hash}
          maxLength={80}
          hint="공백으로 구분 · 최대 8개 · 목록엔 2개 · 있으면 설명 대신 #"
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="px-1 text-[12px] font-semibold text-neutral-400">
            공개 여부
          </legend>
          <div className="flex overflow-hidden rounded-full bg-white shadow-[0_1px_2px_rgba(51,91,115,0.08)]">
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
                      ? 'bg-brand-primary text-white'
                      : 'text-neutral-500 hover:bg-neutral-50'
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
                required
              />
              <PillInput
                label="힌트 (선택)"
                name="passwordHint"
                value={passwordHint}
                onChange={setPasswordHint}
                icon={Hash}
                maxLength={40}
                hint="입장 화면에 작게 보여요"
              />
            </div>
          ) : null}
        </fieldset>
        {error ? <p className={fieldErrorClassName}>{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className={authSubmitClassName}>
          {pending ? '만드는 중…' : '만들기'}
        </button>
      </form>
    </main>
  );
}
