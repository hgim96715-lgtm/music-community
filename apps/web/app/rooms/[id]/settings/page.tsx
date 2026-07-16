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
import {
  fetchRoom,
  updateRoom,
  type ApiRoom,
  type RoomVisibility,
} from '@/lib/rooms';
import { ChevronLeft, Loader2, Music2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/rooms/${roomId}/settings`);
    }
  }, [authLoading, user, router, roomId]);

  useEffect(() => {
    if (!user || !roomId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchRoom(roomId)
      .then((room) => {
        if (cancelled) return;
        if (room.ownerId !== user.id) {
          router.replace(`/rooms/${roomId}`);
          return;
        }
        setRoom(room);
        setName(room.name);
        setDescription(room.description ?? '');
        setVisibility(room.visibility === 'private' ? 'private' : 'public');
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error.instanceOf(Error) ? error.message : '방을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
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
      const updated = await updateRoom(roomId, {
        name: trimmed,
        description: description.trim() || null,
        visibility,
      });
      setRoom(updated);
      router.replace(`/rooms/${roomId}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '방 수정에 실패했습니다.',
      );
    } finally {
      setPending(false);
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
          className="text-sm text-brand-primary hover:underline">
          방 목록
        </Link>
      </main>
    );
  }
  return (
    <main className={`${authPageClassName} gap-6`}>
      <Link
        href={`/rooms/${roomId}`}
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-brand-primary hover:underline">
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
          label="설명 (선택)"
          name="description"
          value={description}
          onChange={setDescription}
          maxLength={200}
          rows={3}
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
            <p className="px-1 text-[12px] text-neutral-400">
              비번·입장 제한은 곧 연결해요. 지금은 표시만 바뀝니다.
            </p>
          ) : null}
        </fieldset>
        {error ? <p className={fieldErrorClassName}>{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className={authSubmitClassName}>
          {pending ? '저장 중…' : '저장'}
        </button>
      </form>
    </main>
  );
}
