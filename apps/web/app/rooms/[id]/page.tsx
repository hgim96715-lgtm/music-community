'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { authPageClassName, fieldErrorClassName } from '@/lib/form';
import {
  formatMessageTimeDivider,
  shouldInsertMessageDivider,
} from '@/lib/date';
import {
  createRoomMessage,
  deleteRoomMessage,
  fetchRoom,
  fetchRoomMessages,
  joinRoom,
  leaveRoom,
  type ApiRoom,
  type ApiRoomMessage,
} from '@/lib/rooms';
import {
  onRoomMessage,
  onRoomMessageDeleted,
  socketJoinRoom,
  socketLeaveRoom,
} from '@/lib/roomsSocket';
import {
  ChevronLeft,
  ImageIcon,
  Link2,
  Loader2,
  Music2,
  Plus,
  Send,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { CommentEmojiPicker } from '@/components/recommendations/CommentEmojiPicker';
import { AvatarActionProvider } from '@/components/friends/AvatarActionContext';
import { FriendIdsProvider } from '@/components/friends/FriendIdsContext';
import { RoomMembersSheet } from '@/components/rooms/RoomMembersSheet';

const ATTACH_ITEMS = [
  {
    id: 'song',
    label: '곡 공유',
    hint: '곧',
    icon: Music2,
  },
  {
    id: 'link',
    label: '링크',
    hint: '곧',
    icon: Link2,
  },
  {
    id: 'image',
    label: '이미지',
    hint: '곧',
    icon: ImageIcon,
  },
] as const;

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [messages, setMessages] = useState<ApiRoomMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  /** Messages/인스타 — 꾹 누르면 뜨는 액션 시트 */
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  /** OS 키보드가 가린 높이(px) — visualViewport */
  const [keyboardInset, setKeyboardInset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const [membersOpen, setMembersOpen] = useState(false);

  function clearLongPress() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function openMessageActions(messageId: string) {
    clearLongPress();
    longPressFiredRef.current = true;
    setEmojiOpen(false);
    setAttachOpen(false);
    setActionTargetId(messageId);
    try {
      navigator.vibrate?.(12);
    } catch {
      /* ignore */
    }
  }

  function startLongPress(messageId: string) {
    longPressFiredRef.current = false;
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      openMessageActions(messageId);
    }, 420);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    function syncKeyboard() {
      const inset = Math.max(
        0,
        window.innerHeight - vv!.height - vv!.offsetTop,
      );
      setKeyboardInset(inset);
      if (inset > 64) {
        setEmojiOpen(false);
        setAttachOpen(false);
      }
    }
    syncKeyboard();
    vv.addEventListener('resize', syncKeyboard);
    vv.addEventListener('scroll', syncKeyboard);
    return () => {
      vv.removeEventListener('resize', syncKeyboard);
      vv.removeEventListener('scroll', syncKeyboard);
    };
  }, []);

  const appendMessage = useCallback((message: ApiRoomMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const load = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError('');
    try {
      const roomData = await fetchRoom(roomId);
      setRoom(roomData);
      let list: ApiRoomMessage[];
      try {
        list = await fetchRoomMessages(roomId);
      } catch {
        await joinRoom(roomId);
        list = await fetchRoomMessages(roomId);
      }
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(sorted);
      await socketJoinRoom(roomId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '방을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/rooms/${roomId}`);
      return;
    }
    void load();
  }, [authLoading, user, load, router, roomId]);

  useEffect(() => {
    if (!roomId || !user) return;
    const offMessage = onRoomMessage(appendMessage);
    const offDeleted = onRoomMessageDeleted(({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    return () => {
      offMessage();
      offDeleted();
      void socketLeaveRoom(roomId);
    };
  }, [roomId, user, appendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function onSend(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !roomId || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await createRoomMessage(roomId, {
        type: 'text',
        body: text,
      });
      appendMessage(message);
      setBody('');
    } catch (error) {
      setError(error instanceof Error ? error.message : '전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId || !roomId) return;
    setDeleting(true);
    setError('');
    try {
      await deleteRoomMessage(roomId, deleteTargetId);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

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
      setError(err instanceof Error ? err.message : '퇴장에 실패했습니다.');
    } finally {
      setLeaving(false);
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
        <p className={fieldErrorClassName}>
          {error || '방을 찾을 수 없습니다.'}
        </p>
        <Link href="/rooms" className="text-sm text-brand-primary underline">
          방 목록
        </Link>
      </main>
    );
  }

  return (
    <FriendIdsProvider>
      <AvatarActionProvider>
        <main
          className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-[#eef2f5]"
          style={{
            // 키보드만큼 화면을 위로 — 메시지·composer가 가려지지 않게
            paddingBottom: keyboardInset,
            transition: 'padding-bottom 120ms ease-out',
          }}>
          <header className="flex shrink-0 items-center gap-1 border-b border-black/[0.04] bg-[#eef2f5]/95 px-2 pb-2.5 pt-2 backdrop-blur-sm">
            <Link
              href="/rooms"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#335b73] transition-colors hover:bg-white/70"
              aria-label="방 목록">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1 px-1 text-center">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-neutral-800">
                {room.name}
              </h1>
              <p className="truncate text-[11px] text-neutral-400">
                {room.owner ? (
                  <>
                    @{room.owner.nickname} ·{' '}
                    <button
                      type="button"
                      onClick={() => setMembersOpen(true)}
                      className="font-medium text-neutral-500 underline-offset-2 hover:underline">
                      {room.memberCount}명
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMembersOpen(true)}
                    className="font-medium text-neutral-500 underline-offset-2 hover:underline">
                    {room.memberCount}명
                  </button>
                )}
              </p>
            </div>
            {room.ownerId !== user.id ? (
              <button
                type="button"
                disabled={leaving}
                onClick={() => setLeaveConfirmOpen(true)}
                className="shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-neutral-400 transition-colors hover:bg-white/70 hover:text-red-500 disabled:opacity-50">
                퇴장
              </button>
            ) : (
              <Link
                href={`/rooms/${room.id}/settings`}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/70 hover:text-[#335b73]"
                aria-label="방 설정">
                <Settings className="size-4" aria-hidden />
              </Link>
            )}
          </header>

      {error ? (
        <p className={`${fieldErrorClassName} px-4 py-1`}>{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
            <p className="text-[15px] font-medium text-neutral-500">
              아직 메시지가 없어요
            </p>
            <p className="text-[13px] text-neutral-400">
              같이 듣는 첫 말을 걸어 보세요
            </p>
          </div>
        ) : (
          messages.map((m, index) => {
            const mine = m.senderId === user.id;
            const canDelete = mine || room.ownerId === user.id;
            const prev = index > 0 ? messages[index - 1] : null;
            const showDivider = shouldInsertMessageDivider(
              prev?.createdAt,
              m.createdAt,
            );
            return (
              <div key={m.id} className="flex w-full flex-col gap-3">
                {showDivider ? (
                  <p className="py-1 text-center text-[11px] font-medium tabular-nums text-neutral-400">
                    {formatMessageTimeDivider(m.createdAt)}
                  </p>
                ) : null}
                <div
                  className={`group/msg relative flex max-w-[78%] flex-col ${mine ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  {!mine ? (
                    <span className="mb-1 px-1.5 text-[11px] font-medium text-neutral-400">
                      @{m.sender.nickname}
                    </span>
                  ) : null}

                  <div
                    role={canDelete ? 'button' : undefined}
                    tabIndex={canDelete ? 0 : undefined}
                    onPointerDown={
                      canDelete
                        ? () => {
                            startLongPress(m.id);
                          }
                        : undefined
                    }
                    onPointerMove={
                      canDelete
                        ? (e) => {
                            // 스크롤 중이면 롱프레스 취소
                            if (
                              longPressTimerRef.current !== null &&
                              (Math.abs(e.movementX) > 6 ||
                                Math.abs(e.movementY) > 6)
                            ) {
                              clearLongPress();
                            }
                          }
                        : undefined
                    }
                    onPointerUp={canDelete ? clearLongPress : undefined}
                    onPointerLeave={canDelete ? clearLongPress : undefined}
                    onPointerCancel={canDelete ? clearLongPress : undefined}
                    onClick={
                      canDelete
                        ? (e) => {
                            if (longPressFiredRef.current) {
                              e.preventDefault();
                              longPressFiredRef.current = false;
                            }
                          }
                        : undefined
                    }
                    onContextMenu={
                      canDelete
                        ? (e) => {
                            e.preventDefault();
                            openMessageActions(m.id);
                          }
                        : undefined
                    }
                    onKeyDown={
                      canDelete
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openMessageActions(m.id);
                            }
                          }
                        : undefined
                    }
                    className={`select-none px-3.5 py-2 text-[15px] leading-snug outline-none touch-manipulation ${
                      mine
                        ? 'rounded-[1.25rem] rounded-br-md bg-[#335b73] text-white'
                        : 'rounded-[1.25rem] rounded-bl-md bg-white text-neutral-800 shadow-[0_0.5px_1px_rgba(0,0,0,0.06)]'
                    }`}>
                    {m.type === 'text' ? m.body : '추천 곡'}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer — Messages식 하단 바 · safe-area */}
      <form
        onSubmit={onSend}
        className="relative z-20 flex shrink-0 items-center gap-1.5 overflow-visible border-t border-black/[0.04] bg-[#e8ecef] px-2.5 pt-2"
        style={{
          paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom, 0px))',
        }}>
        <div className="relative shrink-0">
          <button
            type="button"
            disabled={sending}
            onClick={() => {
              setEmojiOpen(false);
              setAttachOpen((v) => !v);
            }}
            aria-label="첨부"
            aria-expanded={attachOpen}
            className="flex size-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/80 hover:text-neutral-700 disabled:opacity-40">
            <Plus className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
          {attachOpen ? (
            <div
              role="menu"
              aria-label="첨부"
              className="absolute bottom-full left-0 z-30 mb-2 w-44 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
              {ATTACH_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-neutral-400 disabled:cursor-not-allowed">
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 font-medium">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-300">
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <CommentEmojiPicker
          disabled={sending}
          open={emojiOpen}
          onOpenChange={(open) => {
            setEmojiOpen(open);
            if (open) setAttachOpen(false);
          }}
          onPick={(emoji) => setBody((prev) => prev + emoji)}
        />
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => {
            setEmojiOpen(false);
            setAttachOpen(false);
          }}
          maxLength={2000}
          placeholder="메시지"
          className="min-w-0 flex-1 rounded-[1.25rem] border-0 bg-white px-3.5 py-2 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-300 focus:ring-2 focus:ring-[#335b73]/15"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#335b73] text-white transition-transform active:scale-95 disabled:opacity-30"
          aria-label="보내기">
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-3.5" aria-hidden />
          )}
        </button>
      </form>

      {typeof document !== 'undefined' && actionTargetId
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label="메시지 메뉴"
              onClick={() => setActionTargetId(null)}>
              <div
                className="w-full max-w-sm px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-0 sm:pb-0"
                onClick={(e) => e.stopPropagation()}>
                <div className="overflow-hidden rounded-[14px] bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setDeleteTargetId(actionTargetId);
                      setActionTargetId(null);
                    }}
                    className="w-full py-3.5 text-[17px] font-semibold text-red-500 transition-colors active:bg-neutral-100">
                    삭제
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActionTargetId(null)}
                  className="mt-2 w-full rounded-[14px] bg-white py-3.5 text-[17px] font-semibold text-[#335b73] shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-colors active:bg-neutral-50">
                  취소
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <FeedDialog
        open={deleteTargetId !== null}
        title="메시지를 삭제할까요?"
        description="방의 모든 멤버에게서 삭제됩니다."
        confirmLabel="삭제"
        pendingLabel="삭제 중…"
        isPending={deleting}
        onClose={() => !deleting && setDeleteTargetId(null)}
        onConfirm={() => void confirmDelete()}
      />

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
          roomId={room.id}
          roomName={room.name}
          myUserId={user.id}
        />
        </main>
      </AvatarActionProvider>
    </FriendIdsProvider>
  );
}
