'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { AvatarActionProvider } from '@/components/friends/AvatarActionContext';
import { FriendIdsProvider } from '@/components/friends/FriendIdsContext';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { RoomMembersSheet } from '@/components/rooms/RoomMembersSheet';
import {
  authPageClassName,
  authTitleClassName,
  fieldErrorClassName,
} from '@/lib/form';
import { fetchRoom, leaveRoom, type ApiRoom } from '@/lib/rooms';
import { socketLeaveRoom } from '@/lib/roomsSocket';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoomInfoPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = typeof params.id === 'string' ? params.id : '';
  const { user, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const isOwner = Boolean(user && room && room.ownerId === user.id);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/rooms/${roomId}/info`);
    }
  }, [authLoading, user, router, roomId]);

  useEffect(() => {
    if (!user || !roomId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchRoom(roomId)
      .then((data) => {
        if (!cancelled) setRoom(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : '방을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, roomId]);

  async function confirmLeave() {
    if (!roomId || leaving) return;
    setLeaving(true);
    setError('');
    try {
      await leaveRoom(roomId);
      void socketLeaveRoom(roomId);
      setLeaveConfirmOpen(false);
      router.replace('/rooms');
    } catch (err) {
      setError(err instanceof Error ? err.message : '퇴장하는데 실패했어요.');
    } finally {
      setLeaving(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <main className={`${authPageClassName} items-center justify-center`}>
        <Loader2
          className="size-6 animate-spin text-brand-primary"
          aria-hidden
        />
      </main>
    );
  }

  return (
    <FriendIdsProvider>
      <AvatarActionProvider>
        <main className={`${authPageClassName} gap-6`}>
          <div className="flex items-center gap-2">
            <Link
              href={`/rooms/${roomId}`}
              className="inline-flex size-9 items-center justify-center rounded-full text-[#a89880] transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-brand-primary"
              aria-label="채팅으로">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <h1 className={authTitleClassName}>{room?.name} 방으로</h1>
          </div>

          {error ? <p className={fieldErrorClassName}>{error}</p> : null}

          {room ? (
            <>
              <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(28_24_20/0.94)]">
                <button
                  type="button"
                  onClick={() => setMembersOpen(true)}
                  aria-label={`멤버 ${room.memberCount}명 보기`}
                  className="flex w-full items-center justify-between gap-3 border-b border-[rgb(201_166_107/0.14)] px-4 py-3.5 text-left text-[14px] text-[#ebe4da] transition-colors hover:bg-[rgb(201_166_107/0.08)]">
                  <span>멤버</span>
                  <span className="flex items-center gap-1 text-[12px] font-medium text-brand-primary">
                    {room.memberCount}명
                    <ChevronRight
                      className="size-4 shrink-0 text-[#a89880]"
                      aria-hidden
                    />
                  </span>
                </button>

                <Link
                  href={`/rooms/${roomId}/theme`}
                  className="flex items-center justify-between gap-3 border-b border-[rgb(201_166_107/0.14)] px-4 py-3.5 text-[14px] text-[#ebe4da] transition-colors hover:bg-[rgb(201_166_107/0.08)]">
                  <span>꾸미기</span>
                  <ChevronRight
                    className="size-4 shrink-0 text-[#a89880]"
                    aria-hidden
                  />
                </Link>

                {isOwner ? (
                  <Link
                    href={`/rooms/${roomId}/settings`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 text-[14px] text-[#ebe4da] transition-colors hover:bg-[rgb(201_166_107/0.08)]">
                    <span>방 운영</span>
                    <ChevronRight
                      className="size-4 shrink-0 text-[#a89880]"
                      aria-hidden
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={leaving}
                    onClick={() => setLeaveConfirmOpen(true)}
                    className="px-4 py-3.5 text-left text-[14px] font-medium text-red-400 transition-colors hover:bg-[rgb(201_166_107/0.08)] disabled:opacity-50">
                    퇴장
                  </button>
                )}
              </div>
            </>
          ) : null}

          <FeedDialog
            open={leaveConfirmOpen}
            title="이 방에서 나갈까요?"
            description="다시 들어오려면 목록에서 입장하면 됩니다."
            confirmLabel="퇴장"
            pendingLabel="나가는 중…"
            isPending={leaving}
            onClose={() => !leaving && setLeaveConfirmOpen(false)}
            onConfirm={() => void confirmLeave()}
          />
          <RoomMembersSheet
            open={membersOpen}
            onClose={() => setMembersOpen(false)}
            roomId={roomId}
            roomName={room?.name ?? ''}
            myUserId={user.id}
          />
        </main>
      </AvatarActionProvider>
    </FriendIdsProvider>
  );
}
