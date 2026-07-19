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
  ApiRoomMemberWithUser,
  closeRoom,
  fetchRoom,
  fetchRoomMembers,
  kickRoomMember,
  parseTopicTags,
  transferRoom,
  updateRoom,
  type ApiRoom,
  type RoomVisibility,
} from '@/lib/rooms';
import { ChevronLeft, Hash, Loader2, Music2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FeedDialog } from '@/components/recommendations/FeedDialog';

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

  const [members, setMembers] = useState<ApiRoomMemberWithUser[]>([]);
  const [kickTarget, setKickTarget] = useState<ApiRoomMemberWithUser | null>(
    null,
  );
  const [kicking, setKicking] = useState(false);
  const [transferTarget, setTransferTarget] =
    useState<ApiRoomMemberWithUser | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [topicTagsText, setTopicTagsText] = useState('');

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
      .then(async (room) => {
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
        const list = await fetchRoomMembers(roomId);
        if (!cancelled) setMembers(list);
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : '방을 불러오지 못했어요.',
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
        topicTags: parseTopicTags(topicTagsText),
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

  async function confirmKick() {
    if (!kickTarget || kicking) return;
    setKicking(true);
    setError('');
    try {
      await kickRoomMember(roomId, kickTarget.userId);
      setMembers((prev) => prev.filter((m) => m.userId !== kickTarget.userId));
      if (room) {
        setRoom({ ...room, memberCount: Math.max(0, room.memberCount - 1) });
      }
      setKickTarget(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '멤버 강퇴에 실패했습니다.',
      );
    } finally {
      setKicking(false);
    }
  }
  const transferCandidates = members.filter(
    (m) => m.role !== 'owner' && m.userId !== user?.id,
  );

  async function confirmTransfer() {
    if (!transferTarget || transferring) return;
    setTransferring(true);
    setError('');
    try {
      await transferRoom(roomId, transferTarget.userId);
      setTransferDialogOpen(false);
      setTransferTarget(null);
      router.replace(`/rooms/${roomId}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '방장 넘기기에 실패했습니다.',
      );
    } finally {
      setTransferring(false);
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
            <p className="px-1 text-[12px] text-neutral-400">
              비번·입장 제한은 곧 연결해요. 지금은 표시만 바뀝니다.
            </p>
          ) : null}
        </fieldset>
        {error ? <p className={fieldErrorClassName}>{error}</p> : null}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[12px] font-semibold text-neutral-400">
            멤버
          </h2>
          {members.length === 0 ? (
            <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-sm text-neutral-400">
              다른 멤버가 없어요
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(51,91,115,0.06)] divide-y divide-neutral-100/90">
              {members.map((m) => {
                const owner = m.role === 'owner';
                const mine = m.userId === user.id;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-neutral-800">
                        @{m.user.nickname}
                        {mine ? (
                          <span className="ml-1 text-[12px] text-neutral-400">
                            나
                          </span>
                        ) : null}
                      </p>
                      {owner ? (
                        <p className="text-[11px] text-brand-primary">방장</p>
                      ) : null}
                    </div>
                    {!owner && !mine ? (
                      <button
                        type="button"
                        disabled={kicking}
                        onClick={() => setKickTarget(m)}
                        className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-neutral-50 disabled:opacity-50">
                        보내기
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
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
          방장 넘기기
        </h2>
        {transferCandidates.length === 0 ? (
          <p className="px-1 text-[12px] text-neutral-400">
            넘길 멤버가 없어요. 혼자면 아래 「방 닫기」를 쓰세요.
          </p>
        ) : (
          <>
            <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(51,91,115,0.06)] divide-y divide-neutral-100/90">
              {transferCandidates.map((m) => {
                const on = transferTarget?.userId === m.userId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setTransferTarget(m)}
                      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                        on ? 'bg-brand-primary-soft/60' : 'hover:bg-neutral-50'
                      }`}>
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          on
                            ? 'border-brand-primary bg-brand-primary'
                            : 'border-neutral-300'
                        }`}
                        aria-hidden>
                        {on ? (
                          <span className="size-2 rounded-full bg-white" />
                        ) : null}
                      </span>
                      <span className="truncate text-[15px] font-medium text-neutral-800">
                        @{m.user.nickname}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              disabled={!transferTarget || transferring}
              onClick={() => setTransferDialogOpen(true)}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary shadow-[0_1px_2px_rgba(51,91,115,0.06)] hover:bg-neutral-50 disabled:opacity-50">
              선택한 멤버에게 넘기기
            </button>
          </>
        )}
      </section>

      <section className="flex w-full flex-col gap-2">
        <h2 className="px-1 text-[12px] font-semibold text-neutral-400">
          위험 구역
        </h2>
        <p className="px-1 text-[12px] text-neutral-400">
          {room.memberCount <= 1
            ? '혼자 있는 방은 닫으면 목록에서 사라져요.'
            : '방을 닫으면 멤버도 더 이상 들어올 수 없어요. 다른 멤버가 있으면 방장 넘기기를 먼저 고려하세요.'}
        </p>
        <button
          type="button"
          disabled={closing}
          onClick={() => setCloseOpen(true)}
          className="rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-[0_1px_2px_rgba(51,91,115,0.06)] hover:bg-red-50 disabled:opacity-50">
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
      <FeedDialog
        open={kickTarget !== null}
        title={
          kickTarget
            ? `@${kickTarget.user.nickname}님을보낼까요?`
            : '멤버를보낼까요?'
        }
        description="이 방에서 더 이상 채팅할 수 없어요."
        confirmLabel="보내기"
        pendingLabel="보내는 중…"
        isPending={kicking}
        onClose={() => !kicking && setKickTarget(null)}
        onConfirm={() => void confirmKick()}
      />
      <FeedDialog
        open={transferDialogOpen && transferTarget !== null}
        title={
          transferTarget
            ? `@${transferTarget.user.nickname}님에게 방장을 넘길까요?`
            : '방장을 넘길까요?'
        }
        description="넘기면 이 설정 페이지는 더 이상 열 수 없어요. 본인은 일반 멤버가 됩니다."
        confirmLabel="방장 넘기기"
        pendingLabel="넘기는 중…"
        isPending={transferring}
        onClose={() => !transferring && setTransferDialogOpen(false)}
        onConfirm={() => void confirmTransfer()}
      />
    </main>
  );
}
