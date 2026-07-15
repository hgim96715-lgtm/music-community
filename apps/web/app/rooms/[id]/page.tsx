'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { authPageClassName, fieldErrorClassName } from '@/lib/form';
import { formatCommentDate } from '@/lib/date';
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
import { ChevronLeft, ImageIcon, Link2, Loader2, MoreHorizontal, Music2, Plus, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { CommentEmojiPicker } from '@/components/recommendations/CommentEmojiPicker';

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
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  /** OS 키보드가 가린 높이(px) — visualViewport */
  const [keyboardInset, setKeyboardInset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    function syncKeyboard() {
      const inset = Math.max(0, window.innerHeight - vv!.height - vv!.offsetTop);
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

  async function onLeave() {
    if (!roomId || leaving) return;
    setLeaving(true);
    setError('');
    try {
      await leaveRoom(roomId);
      void socketLeaveRoom(roomId);
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
    <main
      className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-brand-bg"
      style={{
        // 키보드만큼 화면을 위로 — 메시지·composer가 가려지지 않게
        paddingBottom: keyboardInset,
        transition: 'padding-bottom 120ms ease-out',
      }}>
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1.5 pt-2">
        <Link
          href="/rooms"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-brand-primary"
          aria-label="방 목록">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-semibold text-neutral-800">
            {room.name}
          </h1>
          <p className="truncate text-[11px] text-neutral-400">
            {room.owner
              ? `@${room.owner.nickname} · ${room.memberCount}명`
              : `${room.memberCount}명`}
          </p>
        </div>
        {room.ownerId !== user.id ? (
          <button
            type="button"
            disabled={leaving}
            onClick={() => void onLeave()}
            className="shrink-0 px-2 text-[11px] font-medium text-neutral-400 transition-colors hover:text-red-500 disabled:opacity-50">
            {leaving ? '…' : '퇴장'}
          </button>
        ) : (
          <span className="w-8 shrink-0 text-center text-[10px] font-medium text-neutral-300">
            방장
          </span>
        )}
      </header>

      {error ? (
        <p className={`${fieldErrorClassName} px-4 py-1`}>{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
            <p className="text-sm text-neutral-500">아직 메시지가 없어요</p>
            <p className="text-xs text-neutral-400">
              같이 듣는 첫 말을 걸어 보세요
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.id;
            const canDelete = mine || room.ownerId === user.id;
            return (
              <div
                key={m.id}
                className={`group/msg flex max-w-[82%] flex-col ${mine ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                {!mine ? (
                  <span className="mb-1 px-1 text-[11px] text-neutral-400">
                    @{m.sender.nickname}
                  </span>
                ) : null}
                <div
                  className={`relative rounded-[1.15rem] px-3.5 py-2 text-[13px] leading-relaxed ${
                    mine
                      ? 'rounded-br-md bg-[#4a6f86] text-white'
                      : 'rounded-bl-md bg-white text-neutral-800 shadow-[0_1px_2px_rgba(51,91,115,0.08)]'
                  } ${canDelete ? 'pr-8' : ''}`}>
                  {m.type === 'text' ? m.body : '추천 곡'}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(m.id)}
                      className={`absolute right-1 top-1 rounded-full p-1 opacity-0 transition-opacity duration-150 group-hover/msg:opacity-70 hover:!opacity-100 focus-visible:opacity-100 ${
                        mine ? 'text-white/80' : 'text-neutral-400'
                      }`}
                      aria-label="메시지 삭제">
                      <MoreHorizontal className="size-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-neutral-300">
                  {formatCommentDate(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer — 하단 고정 흐름 · safe-area · 피커는 이 위(bottom-full) */}
      <form
        onSubmit={onSend}
        className="relative z-20 flex shrink-0 items-center gap-1.5 overflow-visible bg-brand-bg px-3 pt-1"
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
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
            className="flex size-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40">
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
                    <span className="min-w-0 flex-1 font-medium">{item.label}</span>
                    <span className="text-[10px] text-neutral-300">{item.hint}</span>
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
          placeholder="메시지…"
          className="min-w-0 flex-1 rounded-full border-0 bg-white px-3.5 py-2.5 text-sm text-neutral-800 shadow-[0_1px_2px_rgba(51,91,115,0.06)] outline-none placeholder:text-neutral-300 focus:ring-2 focus:ring-[#335b73]/20"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#335b73] text-white shadow-[0_1px_3px_rgba(51,91,115,0.25)] transition-transform active:scale-95 disabled:opacity-35"
          aria-label="보내기">
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
        </button>
      </form>

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
    </main>
  );
}
