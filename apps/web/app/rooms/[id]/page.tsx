'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { authPageClassName, fieldErrorClassName } from '@/lib/form';
import {
  formatMessageTimeDivider,
  shouldInsertMessageDivider,
} from '@/lib/date';
import { hasUnreadNotice, markNoticeSeen } from '@/lib/roomNoticeStorage';
import {
  createRoomMessage,
  deleteRoomMessage,
  fetchRoom,
  fetchRoomMessages,
  joinRoom,
  kickRoomMember,
  leaveRoom,
  updateRoom,
  type ApiRoom,
  type ApiRoomMessage,
} from '@/lib/rooms';
import {
  onRoomKicked,
  onRoomMessage,
  onRoomMessageDeleted,
  onRoomSocketConnect,
  onRoomUpdated,
  socketJoinRoom,
  socketLeaveRoom,
} from '@/lib/roomsSocket';
import {
  ChevronLeft,
  Crown,
  IdCard,
  ImageIcon,
  Link2,
  Loader2,
  Megaphone,
  Music2,
  Plus,
  Quote,
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
import {
  RoomSongCard,
  type RoomSongCardData,
} from '@/components/rooms/RoomSongCard';
import { RoomSongPlaySheet } from '@/components/rooms/RoomSongPlaySheet';
import { RoomSongShareSheet } from '@/components/rooms/RoomSongShareSheet';
import { RoomNoticeSheet } from '@/components/rooms/RoomNoticeSheet';
import { LpAlbumJacket } from '@/components/saved-cards/LpAlbumJacket';
import { markChatSeen } from '@/lib/roomChatUnreadStorage';
import { RoomPhotocardShareSheet } from '@/components/rooms/RoomPhotocardShareSheet';
import { RoomLyricCard } from '@/components/rooms/RoomLyricCard';
import {
  RoomLyricShareSheet,
  type RoomLyricSharePayload,
} from '@/components/rooms/RoomLyricShareSheet';

const ATTACH_ITEMS = [
  {
    id: 'song',
    label: '곡 공유',
    hint: '',
    icon: Music2,
    enabled: true,
  },
  {
    id: 'photocard',
    label: '자켓',
    hint: '',
    icon: IdCard,
    enabled: true,
  },
  {
    id: 'lyric',
    label: '가사',
    hint: '',
    icon: Quote,
    enabled: true,
  },
  {
    id: 'link',
    label: '링크',
    hint: '곧',
    icon: Link2,
    enabled: false,
  },
  {
    id: 'image',
    label: '이미지',
    hint: '곧',
    icon: ImageIcon,
    enabled: false,
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
  const [songShareOpen, setSongShareOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeUnread, setNoticeUnread] = useState(false);
  const [playingSong, setPlayingSong] = useState<RoomSongCardData | null>(null);
  const [photocardShareOpen, setPhotocardShareOpen] = useState(false);
  const [lyricShareOpen, setLyricShareOpen] = useState(false);
  const [playingStartSec, setPlayingStartSec] = useState<number | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [joining, setJoining] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<ApiRoom | null>(null);

  /** OS 키보드가 가린 높이(px) — visualViewport */
  const [keyboardInset, setKeyboardInset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const [membersOpen, setMembersOpen] = useState(false);
  /** 강퇴(ban) 등으로 입장 불가 — 방 UI 없이 모달 */
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

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
    setBlockedMessage(null);
    setRoom(null);
    setMessages([]);
    try {
      const roomData = await fetchRoom(roomId);
      let list: ApiRoomMessage[];
      try {
        list = await fetchRoomMessages(roomId);
      } catch {
        if (roomData.visibility === 'private') {
          setPendingRoom(roomData);
          setJoinPassword('');
          setPasswordOpen(true);
          return;
        }
        await joinRoom(roomId);
        list = await fetchRoomMessages(roomId);
      }
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setRoom(roomData);
      setMessages(sorted);
      if (user?.id) {
        markChatSeen(user.id, roomId, sorted.at(-1)?.createdAt ?? '');
      }
      await socketJoinRoom(roomId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '방을 불러오지 못했습니다.';
      setRoom(null);
      setMessages([]);
      if (message.includes('다시 들어갈 수 없')) {
        setBlockedMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/rooms/${roomId}`);
      return;
    }
    void load();
  }, [authLoading, user?.id, load, router, roomId]);

  useEffect(() => {
    if (!roomId || !user?.id) return;
    const userId = user.id;
    const rejoin = () => {
      void socketJoinRoom(roomId);
    };
    rejoin();
    const offConnect = onRoomSocketConnect(rejoin);

    const offMessage = onRoomMessage((message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      markChatSeen(userId, roomId, message.createdAt);
    });

    const offDeleted = onRoomMessageDeleted(({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });
    const offKicked = onRoomKicked(({ roomId: kickedRoomId }) => {
      if (kickedRoomId !== roomId) return;
      void socketLeaveRoom(roomId);
      router.replace('/rooms');
    });
    const offUpdated = onRoomUpdated((payload) => {
      if (payload.roomId !== roomId) return;
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              description: payload.description,
              name: payload.name,
              topicTags: payload.topicTags,
              updatedAt: payload.updatedAt,
            }
          : prev,
      );
      setNoticeUnread(hasUnreadNotice(userId, roomId, payload.description));
    });

    return () => {
      offConnect();
      offMessage();
      offDeleted();
      offKicked();
      offUpdated();
      void socketLeaveRoom(roomId);
    };
  }, [roomId, user?.id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!room || !user?.id) return;
    setNoticeUnread(hasUnreadNotice(user.id, room.id, room.description));
  }, [room?.id, room?.description, user?.id]);

  function openNotice() {
    setNoticeOpen(true);
  }

  function closeNotice() {
    if (noticeSaving || !room || !user?.id) return;
    markNoticeSeen(user.id, room.id, room.description);
    setNoticeUnread(false);
    setNoticeOpen(false);
  }

  async function onSend(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !roomId || sending) return;
    setSending(true);
    setError('');
    setSongShareOpen(false);
    setAttachOpen(false);
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

  async function shareSong(recommendationId: string) {
    if (!roomId || sending) return;
    setSending(true);
    setError('');
    setSongShareOpen(false);
    setAttachOpen(false);
    try {
      const message = await createRoomMessage(roomId, {
        type: 'recommendation',
        recommendationId,
      });
      appendMessage(message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '곡 공유에 실패했습니다.',
      );
    } finally {
      setSending(false);
    }
  }

  async function sharePhotocard(savedCardId: string) {
    if (!roomId || sending) return;
    setSending(true);
    setError('');
    setPhotocardShareOpen(false);
    setPhotocardShareOpen(false);
    setAttachOpen(false);
    try {
      const message = await createRoomMessage(roomId, {
        type: 'saved_card',
        savedCardId,
      });
      appendMessage(message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '자켓 공유에 실패했습니다.',
      );
    } finally {
      setSending(false);
    }
  }

  async function shareLyric(payload: RoomLyricSharePayload) {
    if (!roomId || sending) return;
    setSending(true);
    setError('');
    setLyricShareOpen(false);
    setAttachOpen(false);
    try {
      const message = await createRoomMessage(roomId, {
        type: 'lyric_quote',
        recommendationId: payload.recommendationId,
        body: payload.body,
        lyricStartSec: payload.lyricStartSec,
        lyricEndSec: payload.lyricEndSec,
      });
      appendMessage(message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '가사 공유에 실패했습니다.',
      );
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

  async function confirmJoinWithPassword() {
    if (!roomId || !pendingRoom || joining) return;
    const pw = joinPassword.trim();
    if (!pw) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }
    setJoining(true);
    setError('');
    try {
      await joinRoom(roomId, pw);
      const list = await fetchRoomMessages(roomId);
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setRoom(pendingRoom);
      setMessages(sorted);
      if (user?.id) {
        markChatSeen(user.id, roomId, sorted.at(-1)?.createdAt ?? '');
      }
      setPasswordOpen(false);
      setPendingRoom(null);
      setJoinPassword('');
      await socketJoinRoom(roomId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '입장에 실패했습니다.';
      if (message.includes('다시 들어갈 수 없')) {
        setPasswordOpen(false);
        setBlockedMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setJoining(false);
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
    function goRooms() {
      setBlockedMessage(null);
      setPasswordOpen(false);
      setPendingRoom(null);
      router.replace('/rooms');
    }
    if (passwordOpen && pendingRoom) {
      return (
        <main className={`${authPageClassName} gap-4`}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
              <p className="text-center text-2xl" aria-hidden>
                🔒
              </p>
              <h2 className="mt-2 text-center text-lg font-semibold text-neutral-800">
                비공개 방
              </h2>
              <p className="mt-1 truncate text-center text-sm text-neutral-500">
                {pendingRoom.name}
              </p>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="px-1 text-[12px] font-semibold text-neutral-400">
                  비밀번호
                </span>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void confirmJoinWithPassword();
                  }}
                  className="rounded-full border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  autoFocus
                />
              </label>
              {pendingRoom.passwordHint ? (
                <p className="mt-2 px-1 text-[12px] text-neutral-400">
                  힌트: {pendingRoom.passwordHint}
                </p>
              ) : null}
              {error ? (
                <p className="mt-2 text-center text-sm text-red-600">{error}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={joining}
                  onClick={goRooms}
                  className="flex-1 rounded-full border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600">
                  닫기
                </button>
                <button
                  type="button"
                  disabled={joining}
                  onClick={() => void confirmJoinWithPassword()}
                  className="flex-1 rounded-full bg-brand-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {joining ? '입장 중…' : '입장'}
                </button>
              </div>
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className={`${authPageClassName} gap-4`}>
        {blockedMessage ? null : (
          <>
            <p className={fieldErrorClassName}>
              {error || '방을 찾을 수 없습니다.'}
            </p>
            <Link
              href="/rooms"
              className="text-sm text-brand-primary underline">
              방 목록
            </Link>
          </>
        )}
        <FeedDialog
          open={blockedMessage !== null}
          title="입장할 수 없어요"
          description={blockedMessage ?? ''}
          confirmLabel="방 목록으로"
          cancelLabel="닫기"
          onClose={goRooms}
          onConfirm={goRooms}
        />
      </main>
    );
  }

  return (
    <FriendIdsProvider>
      <AvatarActionProvider>
        <main
          className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-[color:var(--color-lp-paper-mute)]"
          style={{
            // 키보드만큼 화면을 위로 — 메시지·composer가 가려지지 않게
            paddingBottom: keyboardInset,
            transition: 'padding-bottom 120ms ease-out',
          }}>
          <header className="flex shrink-0 items-center gap-1 border-b border-[rgb(42_34_28/0.08)] bg-[color:var(--color-lp-paper-mute)]/95 px-2 pb-2.5 pt-2 backdrop-blur-sm">
            <Link
              href="/rooms"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-white/70"
              aria-label="방 목록">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1 px-1 text-center">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-neutral-800">
                {room.name}
              </h1>
              <p className="flex min-w-0 items-center justify-center gap-1 truncate text-[11px] text-neutral-400">
                {room.owner ? (
                  <>
                    {user.id === room.ownerId ? (
                      <Crown
                        className="size-3 shrink-0 text-brand-primary"
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 truncate">
                      방장 @{room.owner.nickname} ·{' '}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMembersOpen(true)}
                      className="shrink-0 font-medium text-neutral-500 underline-offset-2 hover:underline">
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
            {room.description?.trim() ||
            room.ownerId === user.id ||
            noticeUnread ? (
              <button
                type="button"
                onClick={openNotice}
                aria-label={noticeUnread ? '방 공지 (새 공지)' : '방 공지'}
                className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/70 hover:text-brand-primary ${
                  room.description?.trim()
                    ? 'text-neutral-400'
                    : 'text-neutral-300'
                }`}>
                <Megaphone className="size-4" aria-hidden />
                {noticeUnread ? (
                  <span
                    className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-primary ring-2 ring-[color:var(--color-lp-paper-mute)]"
                    aria-hidden
                  />
                ) : null}
              </button>
            ) : null}
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
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/70 hover:text-brand-primary"
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
                const senderIsOwner = m.senderId === room.ownerId;
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
                        <span className="mb-1 flex items-center gap-1 px-1.5 text-[11px] font-medium text-neutral-400">
                          {senderIsOwner ? (
                            <Crown
                              className="size-3 shrink-0 text-brand-primary"
                              aria-label="방장"
                            />
                          ) : null}
                          @{m.sender.nickname}
                        </span>
                      ) : null}

                      {m.type === 'recommendation' && m.recommendation ? (
                        <div
                          className="max-w-[min(100%,20rem)] select-none touch-manipulation outline-none"
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
                          onPointerLeave={
                            canDelete ? clearLongPress : undefined
                          }
                          onPointerCancel={
                            canDelete ? clearLongPress : undefined
                          }
                          onContextMenu={
                            canDelete
                              ? (e) => {
                                  e.preventDefault();
                                  openMessageActions(m.id);
                                }
                              : undefined
                          }>
                          <RoomSongCard
                            song={{
                              title: m.recommendation.title,
                              artist: m.recommendation.artist,
                              embedUrl: m.recommendation.embedUrl,
                            }}
                            onPlay={() => {
                              if (longPressFiredRef.current) {
                                longPressFiredRef.current = false;
                                return;
                              }
                              clearLongPress();
                              setPlayingSong({
                                title: m.recommendation!.title,
                                artist: m.recommendation!.artist,
                                embedUrl: m.recommendation!.embedUrl,
                              });
                            }}
                          />
                        </div>
                      ) : m.type === 'saved_card' && m.savedCard ? (
                        <div
                          className="max-w-[7.5rem] select-none touch-manipulation outline-none"
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
                          onPointerLeave={
                            canDelete ? clearLongPress : undefined
                          }
                          onPointerCancel={
                            canDelete ? clearLongPress : undefined
                          }
                          onContextMenu={
                            canDelete
                              ? (e) => {
                                  e.preventDefault();
                                  openMessageActions(m.id);
                                }
                              : undefined
                          }>
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => {
                              if (longPressFiredRef.current) {
                                longPressFiredRef.current = false;
                                return;
                              }
                              clearLongPress();
                              const rec = m.savedCard!.recommendation;
                              setPlayingStartSec(null);
                              setPlayingSong({
                                title: rec.title,
                                artist: rec.artist,
                                embedUrl: rec.embedUrl,
                              });
                            }}>
                            <LpAlbumJacket
                              size="sm"
                              title={m.savedCard.recommendation.title}
                              artist={m.savedCard.recommendation.artist}
                              embedUrl={m.savedCard.recommendation.embedUrl}
                              reason={m.savedCard.recommendation.reason}
                              moods={m.savedCard.recommendation.moods}
                              postedAt={m.savedCard.recommendation.createdAt}
                              savedAt={m.savedCard.createdAt}
                              customization={m.savedCard.customization}
                              className="shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                            />
                          </button>
                        </div>
                      ) : m.type === 'lyric_quote' &&
                        m.recommendation &&
                        m.body ? (
                        <div
                          className="max-w-[min(100%,17.5rem)] select-none touch-manipulation outline-none"
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
                          onPointerLeave={
                            canDelete ? clearLongPress : undefined
                          }
                          onPointerCancel={
                            canDelete ? clearLongPress : undefined
                          }
                          onContextMenu={
                            canDelete
                              ? (e) => {
                                  e.preventDefault();
                                  openMessageActions(m.id);
                                }
                              : undefined
                          }>
                          <RoomLyricCard
                            data={{
                              title: m.recommendation.title,
                              artist: m.recommendation.artist,
                              embedUrl: m.recommendation.embedUrl,
                              lyrics: m.body,
                              startSec: m.lyricStartSec,
                              endSec: m.lyricEndSec,
                            }}
                            onPlay={() => {
                              if (longPressFiredRef.current) {
                                longPressFiredRef.current = false;
                                return;
                              }
                              clearLongPress();
                              setPlayingStartSec(m.lyricStartSec);
                              setPlayingSong({
                                title: m.recommendation!.title,
                                artist: m.recommendation!.artist,
                                embedUrl: m.recommendation!.embedUrl,
                              });
                            }}
                          />
                        </div>
                      ) : (
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
                          onPointerLeave={
                            canDelete ? clearLongPress : undefined
                          }
                          onPointerCancel={
                            canDelete ? clearLongPress : undefined
                          }
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
                              ? 'rounded-[1.25rem] rounded-br-md bg-brand-primary text-[color:var(--color-lp-ink)]'
                              : 'rounded-[1.25rem] rounded-bl-md bg-white text-neutral-800 shadow-[0_0.5px_1px_rgba(0,0,0,0.06)]'
                          }`}>
                          {m.body}
                        </div>
                      )}
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
                        disabled={!item.enabled || sending}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.id === 'song') {
                            setAttachOpen(false);
                            window.setTimeout(() => setSongShareOpen(true), 50);
                            return;
                          }
                          if (item.id === 'photocard') {
                            setAttachOpen(false);
                            window.setTimeout(
                              () => setPhotocardShareOpen(true),
                              50,
                            );
                            return;
                          }
                          if (item.id === 'lyric') {
                            setAttachOpen(false);
                            window.setTimeout(
                              () => setLyricShareOpen(true),
                              50,
                            );
                          }
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm ${
                          item.enabled
                            ? 'text-neutral-800 hover:bg-neutral-50'
                            : 'cursor-not-allowed text-neutral-400'
                        } disabled:opacity-40`}>
                        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                        <span className="min-w-0 flex-1 font-medium">
                          {item.label}
                        </span>
                        {item.hint ? (
                          <span className="text-[10px] text-neutral-300">
                            {item.hint}
                          </span>
                        ) : null}
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
              className="min-w-0 flex-1 rounded-[1.25rem] border-0 bg-white px-3.5 py-2 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-300 focus:ring-2 focus:ring-brand-primary/20"
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
                      className="mt-2 w-full rounded-[14px] bg-white py-3.5 text-[17px] font-semibold text-brand-primary shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-colors active:bg-neutral-50">
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
          <RoomSongShareSheet
            open={songShareOpen}
            userId={user.id}
            sending={sending}
            onClose={() => setSongShareOpen(false)}
            onPick={(id) => void shareSong(id)}
          />
          <RoomPhotocardShareSheet
            open={photocardShareOpen}
            sending={sending}
            onClose={() => setPhotocardShareOpen(false)}
            onPick={(id) => void sharePhotocard(id)}
          />
          <RoomLyricShareSheet
            open={lyricShareOpen}
            userId={user.id}
            sending={sending}
            onClose={() => setLyricShareOpen(false)}
            onSubmit={(payload) => void shareLyric(payload)}
          />
          <RoomSongPlaySheet
            song={playingSong}
            startSec={playingStartSec ?? undefined}
            onClose={() => {
              setPlayingSong(null);
              setPlayingStartSec(null);
            }}
          />
          <RoomNoticeSheet
            open={noticeOpen}
            body={room.description}
            canEdit={room.ownerId === user.id}
            saving={noticeSaving}
            onClose={closeNotice}
            onSave={async (text) => {
              setNoticeSaving(true);
              try {
                const updated = await updateRoom(room.id, {
                  description: text || null,
                });
                setRoom(updated);
                markNoticeSeen(user.id, updated.id, updated.description);
                setNoticeUnread(false);
              } finally {
                setNoticeSaving(false);
              }
            }}
          />
        </main>
      </AvatarActionProvider>
    </FriendIdsProvider>
  );
}
