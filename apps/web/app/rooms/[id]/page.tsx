'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { displayAuthorNickname } from '@/lib/displayAuthor';
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
  hideRoomMessage,
  joinRoom,
  loadRoomChatThemeCached,
  markRoomRead,
  ROOM_TAPBACK_EMOJIS,
  toggleRoomMessageReaction,
  ToogleRoomMessageReactionResult,
  updateRoom,
  type ApiRoom,
  type ApiRoomMessage,
} from '@/lib/rooms';
import {
  onRoomKicked,
  onRoomMessage,
  onRoomMessageDeleted,
  onRoomMessageReaction,
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
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import {
  CommentEmojiPicker,
  EMOJI_GROUPS,
} from '@/components/recommendations/CommentEmojiPicker';
import {
  RoomSongCard,
  type RoomSongCardData,
} from '@/components/rooms/RoomSongCard';
import { RoomSongPlaySheet } from '@/components/rooms/RoomSongPlaySheet';
import { RoomSongShareSheet } from '@/components/rooms/RoomSongShareSheet';
import { RoomNoticeSheet } from '@/components/rooms/RoomNoticeSheet';
import { JacketPreviewModal } from '@/components/saved-cards/JacketPreviewModal';
import { LpAlbumJacket } from '@/components/saved-cards/LpAlbumJacket';
import { RoomPhotocardShareSheet } from '@/components/rooms/RoomPhotocardShareSheet';
import { RoomLyricCard } from '@/components/rooms/RoomLyricCard';
import {
  RoomLyricShareSheet,
  type RoomLyricSharePayload,
} from '@/components/rooms/RoomLyricShareSheet';
import {
  SavedLyricSaveSheet,
  type SavedLyricPreset,
} from '@/components/saved-cards/SavedLyricSaveSheet';
import { createSavedLyric } from '@/lib/api';
import { RoomThemePresetId } from '@/lib/roomThemeStorage';
import { AvatarActionProvider } from '@/components/friends/AvatarActionContext';
import { FeedAuthorNickname } from '@/components/friends/FeedAuthorNickname';
import { FriendIdsProvider } from '@/components/friends/FriendIdsContext';
import {
  CHAT_FONT_FAMILY,
  CHAT_FONT_SCALE_VALUE,
  ChatFontPrefs,
  getChatFontPrefs,
} from '@/lib/chatFontStorage';
import { createRoomMessageReport } from '@/lib/reports';
import { ReportDialog } from '@/components/reports/ReportDialog';

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

/** 나에게서만 삭제 가능 시간 (5분) */
const ROOM_MESSAGE_DELETE_EVERYONE_MS = 5 * 60 * 1000;

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
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  /** Messages/인스타 — 꾹 누르면 뜨는 액션 시트 */
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  /** 탭백 메뉴 닫힌 직후 칩으로 클릭 穿透 방지 */
  const suppressChipClickUntilRef = useRef(0);
  const tapbackInFlightRef = useRef<string | null>(null);

  /** 강퇴(ban) 등으로 입장 불가 — 방 UI 없이 모달 */
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [playingRecId, setPlayingRecId] = useState<string | null>(null);
  const [lyricSaveOpen, setLyricSaveOpen] = useState(false);
  const [lyricSavePreset, setLyricSavePreset] =
    useState<SavedLyricPreset | null>(null);
  const [lyricSaving, setLyricSaving] = useState(false);

  const [previewJacket, setPreviewJacket] = useState<NonNullable<
    (typeof messages)[number]['savedCard']
  > | null>(null);

  const [themePreset, setThemePreset] = useState<RoomThemePresetId>('lp-bar');
  const pathname = usePathname();
  const [themeBgUrl, setThemeBgUrl] = useState<string | null>(null);

  const [hideTargetId, setHideTargetId] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [tapbackMoreOpen, setTapbackMoreOpen] = useState(false);

  const actionMsg = messages.find((m) => m.id === actionTargetId);
  const canDeleteEveryone =
    !!actionMsg &&
    !!user &&
    !!room &&
    (room.ownerId === user.id ||
      (actionMsg.senderId === user.id &&
        Date.now() - new Date(actionMsg.createdAt).getTime() <=
          ROOM_MESSAGE_DELETE_EVERYONE_MS));

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const replyTarget = messages.find((m) => m.id === replyToId) ?? null;

  const isOwnerModTarget =
    !!actionMsg &&
    !!user &&
    !!room &&
    room.ownerId === user.id &&
    actionMsg.senderId !== user.id;

  const showHideForMe = !!actionMsg && !isOwnerModTarget;

  function showHint(message: string) {
    setActionHint(message);
    window.setTimeout(() => setActionHint(null), 2000);
  }

  const [chatFont, setChatFont] = useState<ChatFontPrefs>({
    fontId: 'default',
    scale: 'M',
  });

  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  function applyDeletedMessage(m: ApiRoomMessage) {
    setMessages((prev) => {
      // 방장 tombstone — 유지·교체 (사라지면 안 됨)
      if (m.deletedByOwner === true) {
        const tombstone: ApiRoomMessage = {
          ...m,
          deletedByOwner: true,
          deletedAt:
            typeof m.deletedAt === 'string'
              ? m.deletedAt
              : m.deletedAt
                ? new Date(m.deletedAt).toISOString()
                : new Date().toISOString(),
          body: null,
          recommendationId: null,
          recommendation: null,
          savedCard: null,
          lyricStartSec: null,
          lyricEndSec: null,
          reactions: [],
        };
        const exists = prev.some((x) => x.id === m.id);
        if (exists) {
          return prev.map((x) => (x.id === m.id ? { ...x, ...tombstone } : x));
        }
        return [...prev, tombstone].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      }

      // 작성자 본인 삭제(구멍). 이미 tombstone이면 WS 오탐으로 지우지 않음
      return prev.filter((x) => x.id !== m.id || x.deletedByOwner === true);
    });
  }

  function replySnippet(m: {
    type: ApiRoomMessage['type'];
    body: string | null;
    deletedAt: string | null;
    recommendation?: { title: string } | null;
  }) {
    if (m.deletedAt) return '삭제된 메시지';
    if (m.type === 'text') return m.body?.trim() || '메시지';
    if (m.type === 'recommendation')
      return m.recommendation?.title?.trim() || m.body?.trim() || '곡';
    if (m.type === 'saved_card') return '자켓';
    if (m.type === 'lyric_quote') return m.body?.trim() || '가사';
    return m.body?.trim() || '메시지';
  }

  function clearPlaying() {
    setPlayingSong(null);
    setPlayingStartSec(null);
    setPlayingRecId(null);
  }

  function openPlaying(
    song: RoomSongCardData,
    recommendationId: string,
    startSec?: number | null,
  ) {
    setPlayingSong(song);
    setPlayingRecId(recommendationId);
    setPlayingStartSec(startSec ?? null);
  }

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
    setTapbackMoreOpen(false);
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
        void markRoomRead(roomId);
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
    if (!user || !roomId) return;
    if (pathname !== `/rooms/${roomId}`) return;
    let cancelled = false;
    async function loadTheme() {
      const prefs = await loadRoomChatThemeCached(user!.id, roomId);
      if (cancelled) return;
      setThemePreset(prefs.presetId);
      setThemeBgUrl(prefs.backgroundUrl);
    }
    void loadTheme();
    return () => {
      cancelled = true;
    };
  }, [user, roomId, pathname]);

  useEffect(() => {
    if (!user?.id) return;
    setChatFont(getChatFontPrefs(user.id));
  }, [user?.id, pathname]);

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
      void markRoomRead(roomId);
    });

    const offDeleted = onRoomMessageDeleted((message) => {
      applyDeletedMessage(message);
    });
    const offReaction = onRoomMessageReaction((payload) => {
      applyReactionLocal(payload);
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
      offReaction();
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
        ...(replyToId ? { replyToId } : {}),
      });
      appendMessage(message);
      setBody('');
      setReplyToId(null);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
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
        ...(payload.lyricStartSec !== undefined
          ? { lyricStartSec: payload.lyricStartSec }
          : {}),
        ...(payload.lyricEndSec !== undefined
          ? { lyricEndSec: payload.lyricEndSec }
          : {}),
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
    if (!deleteTargetId || !roomId || !user) return;
    const target = messages.find((m) => m.id === deleteTargetId);
    if (!target) return;
    const asOwnerMod =
      !!room && room.ownerId === user.id && target.senderId !== user.id;
    setDeleting(true);
    setError('');
    try {
      await deleteRoomMessage(roomId, deleteTargetId);
      applyDeletedMessage({
        ...target,
        deletedAt: new Date().toISOString(),
        deletedByOwner: asOwnerMod,
        deletedById: user.id,
        body: null,
        recommendationId: null,
        recommendation: null,
        savedCard: null,
        lyricStartSec: null,
        lyricEndSec: null,
        reactions: [],
      });
      setDeleteTargetId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  async function confirmHide() {
    if (!hideTargetId || !roomId) return;
    setHiding(true);
    setError('');
    try {
      await hideRoomMessage(roomId, hideTargetId);
      setMessages((prev) => prev.filter((m) => m.id !== hideTargetId));
      setHideTargetId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : '숨김에 실패했습니다.');
    } finally {
      setHiding(false);
    }
  }

  async function handleMessageReport(reason: string) {
    if (!reportTargetId || !roomId || isReporting) return;
    setIsReporting(true);
    setError('');
    try {
      await createRoomMessageReport(roomId, reportTargetId, reason);
      setReportTargetId(null);
      showHint('신고를 접수했어요');
    } catch (error) {
      throw error;
    } finally {
      setIsReporting(false);
    }
  }
  function applyReactionLocal(payload: ToogleRoomMessageReactionResult) {
    if (!payload.messageId || !payload.userId || !payload.emoji) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== payload.messageId) return m;
        const reactions = m.reactions ?? [];
        const withoutMineEmoji = reactions.filter(
          (r) => !(r.userId === payload.userId && r.emoji === payload.emoji),
        );
        if (payload.removed) {
          return { ...m, reactions: withoutMineEmoji };
        }
        return {
          ...m,
          reactions: [
            ...withoutMineEmoji,
            {
              emoji: payload.emoji,
              userId: payload.userId,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
    );
  }

  async function toggleTapback(messageId: string, emoji: string) {
    if (!roomId) return;
    const lockKey = `${messageId}:${emoji}`;
    if (tapbackInFlightRef.current === lockKey) return;
    tapbackInFlightRef.current = lockKey;
    try {
      const result = await toggleRoomMessageReaction(roomId, messageId, emoji);
      applyReactionLocal(result);
    } finally {
      window.setTimeout(() => {
        if (tapbackInFlightRef.current === lockKey) {
          tapbackInFlightRef.current = null;
        }
      }, 350);
    }
  }

  async function onTapback(emoji: string) {
    if (!actionTargetId || !roomId) return;
    const messageId = actionTargetId;
    // 메뉴가 먼저 사라지면 아래 칩으로 같은 클릭이 새어 추가→즉시 취소됨
    suppressChipClickUntilRef.current = Date.now() + 500;
    setActionTargetId(null);
    setTapbackMoreOpen(false);

    try {
      await toggleTapback(messageId, emoji);
    } catch (error) {
      setError(error instanceof Error ? error.message : '반응에 실패했습니다.');
    }
  }

  function reactionChips(m: ApiRoomMessage) {
    const map = new Map<
      string,
      { emoji: string; count: number; mine: boolean }
    >();
    for (const r of m.reactions ?? []) {
      const cur = map.get(r.emoji) ?? {
        emoji: r.emoji,
        count: 0,
        mine: false,
      };
      cur.count += 1;
      if (user && r.userId === user.id) cur.mine = true;
      map.set(r.emoji, cur);
    }
    return [...map.values()];
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
        void markRoomRead(roomId);
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
        <main
          className={`room-theme--${themePreset} room-chat-font mx-auto flex h-[100dvh] w-full max-w-lg flex-col`}
          style={{
            paddingBottom: keyboardInset,
            transition: 'padding-bottom 120ms ease-out',
            ['--room-chat-font-family' as string]:
              CHAT_FONT_FAMILY[chatFont.fontId],
            ['--room-chat-font-scale' as string]: String(
              CHAT_FONT_SCALE_VALUE[chatFont.scale],
            ),
            ...(themeBgUrl
              ? {
                  backgroundImage: `linear-gradient(rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.55)), url("${themeBgUrl.replace(/"/g, '')}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}),
          }}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.96)] p-5 shadow-[0_16px_48px_rgb(0_0_0/0.42)]">
              <p className="text-center text-2xl" aria-hidden>
                🔒
              </p>
              <h2 className="mt-2 text-center text-lg font-semibold text-[#ebe3d8]">
                비공개 방
              </h2>
              <p className="mt-1 truncate text-center text-sm text-[#a89880]">
                {pendingRoom.name}
              </p>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="px-1 text-[12px] font-semibold text-[#a89880]">
                  비밀번호
                </span>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void confirmJoinWithPassword();
                  }}
                  className="rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(26_22_18/0.55)] px-4 py-2.5 text-sm text-[#ebe3d8] outline-none focus:border-brand-primary"
                  autoFocus
                />
              </label>
              {pendingRoom.passwordHint ? (
                <p className="mt-2 px-1 text-[12px] text-[#a89880]">
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
                  className="flex-1 rounded-full border border-[rgb(201_166_107/0.28)] py-2.5 text-sm font-semibold text-[#cbbba0]">
                  닫기
                </button>
                <button
                  type="button"
                  disabled={joining}
                  onClick={() => void confirmJoinWithPassword()}
                  className="flex-1 rounded-full bg-brand-primary py-2.5 text-sm font-semibold text-[color:var(--color-lp-ink)] disabled:opacity-50">
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
          className={`room-theme--${themePreset} room-chat-font mx-auto flex h-[100dvh] w-full max-w-lg flex-col`}
          style={{
            // 키보드만큼 화면을 위로 — 메시지·composer가 가려지지 않게
            paddingBottom: keyboardInset,
            transition: 'padding-bottom 120ms ease-out',
            ['--room-chat-font-family' as string]:
              CHAT_FONT_FAMILY[chatFont.fontId],
            ['--room-chat-font-scale' as string]: String(
              CHAT_FONT_SCALE_VALUE[chatFont.scale],
            ),
            ...(themeBgUrl
              ? {
                  backgroundImage: `linear-gradient(rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.55)), url("${themeBgUrl.replace(/"/g, '')}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}),
          }}>
          <header className="flex shrink-0 items-center gap-1 border-b border-[rgb(201_166_107/0.18)] bg-[rgb(26_22_18/0.92)] px-2 pb-2.5 pt-2 backdrop-blur-sm">
            <Link
              href="/rooms"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-[rgb(201_166_107/0.12)]"
              aria-label="방 목록">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1 px-1 text-center">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#ebe3d8]">
                {room.name}
              </h1>
              <p className="flex min-w-0 items-center justify-center gap-1 truncate text-[11px] text-[#a89880]">
                {room.owner ? (
                  <>
                    {user.id === room.ownerId ? (
                      <Crown
                        className="size-3 shrink-0 text-brand-primary"
                        aria-hidden
                      />
                    ) : null}
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <span className="shrink-0">방장</span>
                      <FeedAuthorNickname
                        userId={room.owner.id}
                        nickname={room.owner.nickname}
                        roomId={room.id}
                        roomOwnerId={room.ownerId}
                        className="text-[11px] font-medium text-[#a89880]"
                      />
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            {room.description?.trim() ||
            room.ownerId === user.id ||
            noticeUnread ? (
              <button
                type="button"
                onClick={openNotice}
                aria-label={noticeUnread ? '방 공지 (새 공지)' : '방 공지'}
                className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-brand-primary ${
                  room.description?.trim() ? 'text-[#a89880]' : 'text-[#6b5c4c]'
                }`}>
                <Megaphone className="size-4" aria-hidden />
                {noticeUnread ? (
                  <span
                    className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-primary ring-2 ring-[color:var(--color-brand-bg)]"
                    aria-hidden
                  />
                ) : null}
              </button>
            ) : null}
            <Link
              href={`/rooms/${room.id}/info`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#a89880] transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-brand-primary"
              aria-label="이 방">
              <Settings className="size-4" aria-hidden />
            </Link>
          </header>

          {error ? (
            <p className={`${fieldErrorClassName} px-4 py-1`}>{error}</p>
          ) : actionHint ? (
            <p className="px-4 py-1 text-center text-xs text-[#a89880]">
              {actionHint}
            </p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
                <p className="text-[15px] font-medium text-[#cbbba0]">
                  아직 메시지가 없어요
                </p>
                <p className="text-[13px] text-[#a89880]">
                  같이 듣는 첫 말을 걸어 보세요
                </p>
              </div>
            ) : (
              messages.map((m, index) => {
                const mine = m.senderId === user.id;
                const senderIsOwner = m.senderId === room.ownerId;
                const canOpenActions = !(m.deletedAt && m.deletedByOwner);
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
                    {m.type === 'system' ? (
                      <p className="px-2 py-0.5 text-center text-[11px] leading-snug text-[#8a8070]">
                        {m.body?.trim() || '멤버가 방장에 의해 나갔습니다'}
                      </p>
                    ) : (
                      <div
                        className={`group/msg relative flex max-w-[78%] flex-col ${mine ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        {!mine ? (
                          <span className="mb-1 flex items-center gap-1 px-1.5 text-[11px] font-medium text-[#a89880]">
                            {senderIsOwner ? (
                              <Crown
                                className="size-3 shrink-0 text-brand-primary"
                                aria-label="방장"
                              />
                            ) : null}
                            <FeedAuthorNickname
                              userId={m.senderId}
                              nickname={m.sender.nickname}
                              roomId={room.id}
                              roomOwnerId={room.ownerId}
                              className="text-[11px] font-medium text-[#a89880]"
                            />
                          </span>
                        ) : null}

                        {m.deletedAt && m.deletedByOwner ? (
                          <div
                            className={`room-bubble select-none px-3.5 py-2 text-[15px] leading-snug ${
                              mine
                                ? 'room-bubble--mine rounded-[1.25rem] rounded-br-md bg-brand-primary/55 text-[color:var(--color-lp-ink)]/70'
                                : 'room-bubble--other rounded-[1.25rem] rounded-bl-md border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.72)] text-[#a89880] shadow-[0_1px_4px_rgb(0_0_0/0.25)]'
                            }`}>
                            <span className="italic">
                              방장에 의해 삭제되었습니다
                            </span>
                          </div>
                        ) : (
                          <>
                            {m.replyTo && m.type !== 'text' ? (
                              <div
                                className={`mb-1.5 max-w-full border-l-2 pl-2 ${
                                  mine
                                    ? 'self-end border-[rgb(201_166_107/0.55)]'
                                    : 'self-start border-brand-primary/55'
                                }`}>
                                <p className="truncate text-[10px] font-medium text-brand-primary">
                                  {m.replyTo.sender.nickname}
                                </p>
                                <p className="truncate text-[11px] leading-snug text-[#a89880]">
                                  {replySnippet(m.replyTo)}
                                </p>
                              </div>
                            ) : null}

                            {m.type === 'recommendation' && m.recommendation ? (
                              <div
                                className="max-w-[min(100%,20rem)] select-none touch-manipulation outline-none"
                                onPointerDown={
                                  canOpenActions
                                    ? () => {
                                        startLongPress(m.id);
                                      }
                                    : undefined
                                }
                                onPointerMove={
                                  canOpenActions
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
                                onPointerUp={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerLeave={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerCancel={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onContextMenu={
                                  canOpenActions
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
                                    openPlaying(
                                      {
                                        title: m.recommendation!.title,
                                        artist: m.recommendation!.artist,
                                        embedUrl: m.recommendation!.embedUrl,
                                      },
                                      m.recommendation!.id,
                                    );
                                  }}
                                />
                              </div>
                            ) : m.type === 'saved_card' && m.savedCard ? (
                              <div
                                className="max-w-[7.5rem] select-none touch-manipulation outline-none"
                                onPointerDown={
                                  canOpenActions
                                    ? () => {
                                        startLongPress(m.id);
                                      }
                                    : undefined
                                }
                                onPointerMove={
                                  canOpenActions
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
                                onPointerUp={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerLeave={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerCancel={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onContextMenu={
                                  canOpenActions
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
                                    setPreviewJacket(m.savedCard!);
                                  }}>
                                  <LpAlbumJacket
                                    size="sm"
                                    title={m.savedCard.recommendation.title}
                                    artist={m.savedCard.recommendation.artist}
                                    embedUrl={
                                      m.savedCard.recommendation.embedUrl
                                    }
                                    reason={m.savedCard.recommendation.reason}
                                    moods={m.savedCard.recommendation.moods}
                                    postedAt={
                                      m.savedCard.recommendation.createdAt
                                    }
                                    savedAt={m.savedCard.createdAt}
                                    customization={m.savedCard.customization}
                                    className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] overflow-visible"
                                  />
                                </button>
                              </div>
                            ) : m.type === 'lyric_quote' &&
                              m.recommendation &&
                              m.body ? (
                              <div
                                className="max-w-[min(100%,17.5rem)] select-none touch-manipulation outline-none"
                                onPointerDown={
                                  canOpenActions
                                    ? () => {
                                        startLongPress(m.id);
                                      }
                                    : undefined
                                }
                                onPointerMove={
                                  canOpenActions
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
                                onPointerUp={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerLeave={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerCancel={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onContextMenu={
                                  canOpenActions
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
                                    setPreviewJacket(m.savedCard!);
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                role={canOpenActions ? 'button' : undefined}
                                tabIndex={canOpenActions ? 0 : undefined}
                                onPointerDown={
                                  canOpenActions
                                    ? () => {
                                        startLongPress(m.id);
                                      }
                                    : undefined
                                }
                                onPointerMove={
                                  canOpenActions
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
                                onPointerUp={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerLeave={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onPointerCancel={
                                  canOpenActions ? clearLongPress : undefined
                                }
                                onClick={
                                  canOpenActions
                                    ? (e) => {
                                        if (longPressFiredRef.current) {
                                          e.preventDefault();
                                          longPressFiredRef.current = false;
                                        }
                                      }
                                    : undefined
                                }
                                onContextMenu={
                                  canOpenActions
                                    ? (e) => {
                                        e.preventDefault();
                                        openMessageActions(m.id);
                                      }
                                    : undefined
                                }
                                onKeyDown={
                                  canOpenActions
                                    ? (e) => {
                                        if (
                                          e.key === 'Enter' ||
                                          e.key === ' '
                                        ) {
                                          e.preventDefault();
                                          openMessageActions(m.id);
                                        }
                                      }
                                    : undefined
                                }
                                className={`room-bubble select-none px-3.5 py-2 text-[15px] leading-snug outline-none touch-manipulation ${
                                  mine
                                    ? 'room-bubble--mine rounded-[1.25rem] rounded-br-md bg-brand-primary text-[color:var(--color-lp-ink)]'
                                    : 'room-bubble--other rounded-[1.25rem] rounded-bl-md border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.92)] text-[#ebe3d8] shadow-[0_1px_4px_rgb(0_0_0/0.25)]'
                                }`}>
                                {m.replyTo ? (
                                  <div
                                    className={`mb-1.5 border-l-2 pl-2 ${
                                      mine
                                        ? 'border-[color:var(--color-lp-ink)]/28'
                                        : 'border-[rgb(201_166_107/0.5)]'
                                    }`}>
                                    <p
                                      className={`truncate text-[10px] font-semibold ${
                                        mine
                                          ? 'text-[color:var(--color-lp-ink)]/65'
                                          : 'text-brand-primary'
                                      }`}>
                                      {m.replyTo.sender.nickname}
                                    </p>
                                    <p
                                      className={`truncate text-[11px] leading-snug ${
                                        mine
                                          ? 'text-[color:var(--color-lp-ink)]/48'
                                          : 'text-[#a89880]'
                                      }`}>
                                      {replySnippet(m.replyTo)}
                                    </p>
                                  </div>
                                ) : null}
                                <span className="whitespace-pre-wrap break-words">
                                  {m.body}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {!(m.deletedAt && m.deletedByOwner) &&
                        reactionChips(m).length > 0 ? (
                          <div
                            className={`mt-1 flex flex-wrap gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                            {reactionChips(m).map((chip) => (
                              <button
                                key={chip.emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    Date.now() <
                                    suppressChipClickUntilRef.current
                                  ) {
                                    return;
                                  }
                                  void (async () => {
                                    try {
                                      await toggleTapback(m.id, chip.emoji);
                                    } catch (err) {
                                      setError(
                                        err instanceof Error
                                          ? err.message
                                          : '탭백에 실패했습니다.',
                                      );
                                    }
                                  })();
                                }}
                                className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[12px] leading-none ${
                                  chip.mine
                                    ? 'border-brand-primary/50 bg-brand-primary/15 text-[#ebe3d8]'
                                    : 'border-[rgb(201_166_107/0.22)] bg-[rgb(28_24_20/0.9)] text-[#ebe3d8]'
                                }`}>
                                <span>{chip.emoji}</span>
                                {chip.count > 1 ? (
                                  <span className="tabular-nums text-[10px] text-[#a89880]">
                                    {chip.count}
                                  </span>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* composer — Messages식 하단 바 · safe-area */}
          <form
            onSubmit={onSend}
            className="room-composer relative z-20 flex shrink-0 flex-col overflow-visible border-t border-[rgb(201_166_107/0.18)] bg-[rgb(22_18_15/0.98)] px-2.5 pt-2"
            style={{
              paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom, 0px))',
            }}>
            {replyTarget ? (
              <div className="mb-1.5 flex items-center gap-2 border-l-2 border-brand-primary/65 pl-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-brand-primary">
                    {replyTarget.sender.nickname}
                  </p>
                  <p className="truncate text-[12px] leading-snug text-[#a89880]">
                    {replySnippet(replyTarget)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToId(null)}
                  aria-label="답글 취소"
                  className="rounded-full p-1 text-[#a89880] hover:text-[#ebe3d8]">
                  <X className="size-3.5" />
                </button>
              </div>
            ) : null}
            <div className="flex items-end gap-1.5">
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
                  className="flex size-9 items-center justify-center rounded-full text-[#a89880] transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-[#ebe3d8] disabled:opacity-40">
                  <Plus className="size-5" strokeWidth={1.75} aria-hidden />
                </button>
                {attachOpen ? (
                  <div
                    role="menu"
                    aria-label="첨부"
                    className="absolute bottom-full left-0 z-30 mb-2 w-44 overflow-hidden rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(28_24_20/0.98)] py-1 shadow-[0_8px_28px_rgb(0_0_0/0.4)]">
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
                              window.setTimeout(
                                () => setSongShareOpen(true),
                                50,
                              );
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
                              ? 'text-[#ebe3d8] hover:bg-[rgb(201_166_107/0.1)]'
                              : 'cursor-not-allowed text-[#6b5c4c]'
                          } disabled:opacity-40`}>
                          <Icon
                            className="size-4 shrink-0"
                            strokeWidth={1.75}
                          />
                          <span className="min-w-0 flex-1 font-medium">
                            {item.label}
                          </span>
                          {item.hint ? (
                            <span className="text-[10px] text-[#8a8070]">
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
                onFocus={() => {
                  setEmojiOpen(false);
                  setAttachOpen(false);
                }}
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

          {typeof document !== 'undefined' && actionTargetId
            ? createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(10_8_6/0.45)] px-4 backdrop-blur-[2px]"
                  role="dialog"
                  aria-modal="true"
                  aria-label="메시지 메뉴"
                  onClick={() => {
                    setActionTargetId(null);
                    setTapbackMoreOpen(false);
                  }}>
                  <div
                    className="flex w-full max-w-sm flex-col items-center gap-3"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="flex w-full items-center gap-1 rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.94)] py-1.5 pl-2 pr-1.5 shadow-[0_8px_32px_rgb(0_0_0/0.45)] backdrop-blur-md">
                      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {ROOM_TAPBACK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => void onTapback(emoji)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[20px] transition-transform active:scale-90"
                            aria-label={`${emoji} 탭백`}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setTapbackMoreOpen((v) => !v)}
                        aria-label="이모지 더보기"
                        aria-expanded={tapbackMoreOpen}
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                          tapbackMoreOpen
                            ? 'bg-brand-primary/20 text-brand-primary'
                            : 'text-[#a89880] hover:bg-[rgb(201_166_107/0.12)] hover:text-[#ebe3d8]'
                        }`}>
                        <Plus className="size-4" strokeWidth={2} aria-hidden />
                      </button>
                    </div>

                    {tapbackMoreOpen ? (
                      <div className="max-h-[min(14rem,40vh)] w-full overflow-y-auto overscroll-contain rounded-2xl border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.96)] p-2 shadow-[0_8px_28px_rgb(0_0_0/0.4)] backdrop-blur-md">
                        {EMOJI_GROUPS.map((group) => (
                          <div key={group.label} className="mb-2.5 last:mb-0">
                            <p className="px-1.5 pb-1 pt-0.5 text-[10px] font-medium text-[#a89880]">
                              {group.label}
                            </p>
                            <div className="grid grid-cols-8 gap-0.5">
                              {group.emojis.map((emoji, i) => (
                                <button
                                  key={`${group.label}-${i}-${emoji}`}
                                  type="button"
                                  onClick={() => void onTapback(emoji)}
                                  className="flex aspect-square items-center justify-center rounded-lg text-lg transition-colors hover:bg-[rgb(201_166_107/0.12)] active:bg-[rgb(201_166_107/0.2)]">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyToId(actionTargetId);
                          setActionTargetId(null);
                          setTapbackMoreOpen(false);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.94)] px-3.5 py-2 text-[13px] font-semibold text-[#ebe4da] shadow-[0_4px_16px_rgb(0_0_0/0.3)] backdrop-blur-md transition-transform active:scale-95">
                        답글
                      </button>
                      {showHideForMe ? (
                        <button
                          type="button"
                          disabled={hiding}
                          onClick={() => {
                            setHideTargetId(actionTargetId);
                            setActionTargetId(null);
                            setTapbackMoreOpen(false);
                          }}
                          className="rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.94)] px-3.5 py-2 text-[13px] font-semibold text-[#ebe4da] shadow-[0_4px_16px_rgb(0_0_0/0.3)] backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40">
                          나에게서만 삭제
                        </button>
                      ) : null}
                      {canDeleteEveryone ? (
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => {
                            setDeleteTargetId(actionTargetId);
                            setActionTargetId(null);
                            setTapbackMoreOpen(false);
                          }}
                          className="rounded-full border border-red-400/30 bg-[rgb(28_24_20/0.94)] px-3.5 py-2 text-[13px] font-semibold text-red-300 shadow-[0_4px_16px_rgb(0_0_0/0.3)] backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40">
                          전체에서 삭제
                        </button>
                      ) : null}
                      {actionMsg && actionMsg.senderId !== user.id ? (
                        <button
                          type="button"
                          disabled={isReporting}
                          onClick={() => {
                            setReportTargetId(actionTargetId);
                            setActionTargetId(null);
                            setTapbackMoreOpen(false);
                          }}
                          className="rounded-full border border-amber-400/30 bg-[rgb(28_24_20/0.94)] px-3.5 py-2 text-[13px] font-semibold text-amber-300 shadow-[0_4px_16px_rgb(0_0_0/0.3)] backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40">
                          신고
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}
          <ReportDialog
            open={reportTargetId !== null}
            title="이 메시지를 신고할까요?"
            isPending={isReporting}
            onClose={() => {
              if (!isReporting) setReportTargetId(null);
            }}
            onSubmit={handleMessageReport}
          />

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
            open={hideTargetId !== null}
            title="나에게서만 삭제할까요?"
            description="다른 멤버 화면에는 그대로 남습니다."
            confirmLabel="삭제"
            pendingLabel="삭제 중…"
            isPending={hiding}
            onClose={() => !hiding && setHideTargetId(null)}
            onConfirm={() => void confirmHide()}
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
            onSaveLyric={
              playingSong && playingRecId
                ? () => {
                    setLyricSavePreset({
                      recommendationId: playingRecId,
                      title: playingSong.title,
                      artist: playingSong.artist,
                      embedUrl: playingSong.embedUrl,
                      startSec: playingStartSec ?? undefined,
                    });
                    clearPlaying();
                    setLyricSaveOpen(true);
                  }
                : undefined
            }
            onClose={clearPlaying}
          />
          <SavedLyricSaveSheet
            open={lyricSaveOpen}
            userId={user.id}
            saving={lyricSaving}
            preset={lyricSavePreset}
            onClose={() => {
              setLyricSaveOpen(false);
              setLyricSavePreset(null);
            }}
            onSubmit={(body) => {
              void (async () => {
                setLyricSaving(true);
                try {
                  await createSavedLyric(body);
                  setLyricSaveOpen(false);
                  setLyricSavePreset(null);
                } catch (e) {
                  alert(e instanceof Error ? e.message : '저장에 실패했어요');
                } finally {
                  setLyricSaving(false);
                }
              })();
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
          <JacketPreviewModal
            jacket={previewJacket}
            onClose={() => setPreviewJacket(null)}
          />
        </main>
      </AvatarActionProvider>
    </FriendIdsProvider>
  );
}
