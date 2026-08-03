'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { CommentEmojiPicker } from '@/components/recommendations/CommentEmojiPicker';
import {
  formatMessageTimeDivider,
  shouldInsertMessageDivider,
} from '@/lib/date';
import { authPageClassName, fieldErrorClassName } from '@/lib/form';
import {
  fetchDm,
  fetchDmMessages,
  markDmRead,
  sendDmMessage,
  type ApiDmMessage,
  type ApiDmUser,
} from '@/lib/dms';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  onDmMessage,
  onRoomSocketConnect,
  socketJoinDm,
  socketLeaveDm,
} from '@/lib/roomsSocket';
import { ApiRoomMessage } from '@/lib/rooms';

export default function DmChatPage() {
  const params = useParams();
  const dmId = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [other, setOther] = useState<ApiDmUser | null>(null);
  const [messages, setMessages] = useState<ApiDmMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/messages/${dmId}`);
      return;
    }
    if (!dmId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [list, detail] = await Promise.all([
          fetchDmMessages(dmId),
          fetchDm(dmId),
        ]);
        if (cancelled) return;
        const sorted = [...list].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setMessages(sorted);
        setOther(detail.other);
        void markDmRead(dmId);
      } catch (error) {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : '대화를 불러오지 못했어요.',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, dmId]);

  useEffect(() => {
    if (!user || !dmId || loading) return;
    void socketJoinDm(dmId);
    const offConnect = onRoomSocketConnect(() => {
      void socketJoinDm(dmId);
    });
    const offMessage = onDmMessage((message) => {
      if (message.dmId !== dmId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      void markDmRead(dmId);
    });
    return () => {
      offConnect();
      offMessage();
      void socketLeaveDm(dmId);
    };
  }, [user, dmId, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: React.SubmitEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !dmId) return;
    setSending(true);
    setError('');
    try {
      const msg = await sendDmMessage(dmId, text);
      setMessages((prev) => {
        return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
      });
      setBody('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      void markDmRead(dmId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '메시지 전송에 실패했어요.',
      );
    } finally {
      setSending(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <main className={`${authPageClassName} items-center justify-center`}>
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  const title = other?.nickname ? `@${other.nickname}` : '메시지';

  return (
    <main className="mx-auto flex h-[100dvh] max-w-lg flex-col bg-[color:var(--color-brand-bg)]">
      <header className="flex shrink-0 items-center gap-1 border-b border-[rgb(201_166_107/0.18)] bg-[rgb(26_22_18/0.92)] px-2 pb-2.5 pt-2 backdrop-blur-sm">
        <Link
          href="/messages"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-[rgb(201_166_107/0.12)]"
          aria-label="메시지 목록">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1 px-1 text-center">
          {other?.id ? (
            <Link
              href={`/users/${other.id}`}
              className="truncate text-[15px] font-semibold tracking-tight text-[#ebe3d8] transition-colors hover:text-brand-primary">
              {title}
            </Link>
          ) : (
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#ebe3d8]">
              {title}
            </h1>
          )}
        </div>
        <span className="size-9 shrink-0" aria-hidden />
      </header>
      {error ? (
        <p className={`${fieldErrorClassName} px-4 py-1`}>{error}</p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
            <p className="text-[15px] font-medium text-[#cbbba0]">
              아직 메시지가 없어요
            </p>
            <p className="text-[13px] text-[#a89880]">첫 말을 걸어 보세요</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const mine = m.senderId === user.id;
            const prev = index > 0 ? messages[index - 1] : null;
            const showDivider = shouldInsertMessageDivider(
              prev?.createdAt,
              m.createdAt,
            );
            return (
              <div key={m.id} className="flex w-full flex-col gap-3">
                {showDivider ? (
                  <p className="py-1 text-center text-[11px] font-medium tabular-nums text-[#a89880]">
                    {formatMessageTimeDivider(m.createdAt)}
                  </p>
                ) : null}
                <div
                  className={`flex max-w-[78%] flex-col ${mine ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words ${
                      mine
                        ? 'rounded-br-md bg-brand-primary text-[color:var(--color-lp-ink)]'
                        : 'rounded-bl-md bg-[rgb(42_36_30)] text-[#ebe3d8]'
                    }`}>
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => void handleSend(e)}
        className="shrink-0 border-t border-[rgb(201_166_107/0.18)] bg-[rgb(26_22_18/0.96)] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <CommentEmojiPicker
            disabled={sending}
            open={emojiOpen}
            onOpenChange={setEmojiOpen}
            onPick={(emoji) => setBody((prev) => prev + emoji)}
          />
          <textarea
            ref={inputRef}
            value={body}
            rows={1}
            maxLength={2000}
            placeholder="메시지"
            onChange={(e) => {
              setBody(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            onFocus={() => setEmojiOpen(false)}
            className="max-h-[7.5rem] min-w-0 flex-1 resize-none overflow-y-auto rounded-[1.25rem] border-0 bg-[rgb(42_36_30)] px-3.5 py-2 text-[15px] leading-snug text-[#ebe3d8] outline-none placeholder:text-[#8a8070] focus:ring-2 focus:ring-brand-primary/25"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[color:var(--color-lp-ink)] transition-transform active:scale-95 disabled:opacity-30"
            aria-label="보내기">
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
