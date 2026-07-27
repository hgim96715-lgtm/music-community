'use client';

import { useAvatarAction } from '@/components/friends/AvatarActionContext';
import { useFriendIdSet } from '@/components/friends/FriendIdsContext';
import { ApiRoomMemberWithUser, fetchRoomMembers } from '@/lib/rooms';
import { Loader2, Search, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  myUserId: string;
};

export function RoomMembersSheet({
  open,
  onClose,
  roomId,
  roomName,
  myUserId,
}: Props) {
  const { openSheet } = useAvatarAction();
  const friendIds = useFriendIdSet();
  const [members, setMembers] = useState<ApiRoomMemberWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setMembers([]);
      setTotal(0);
      setNextCursor(null);
      setError('');
      return;
    }

    const reqId = ++reqIdRef.current;
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      setError('');
      setMembers([]);
      setNextCursor(null);
      fetchRoomMembers(roomId, {
        q: query.trim() || undefined,
        limit: 30,
      })
        .then((page) => {
          if (cancelled || reqId !== reqIdRef.current) return;
          setMembers(page.items);
          setNextCursor(page.nextCursor);
          setTotal(page.total);
        })
        .catch((error) => {
          if (cancelled || reqId !== reqIdRef.current) return;
          setError(
            error instanceof Error
              ? error.message
              : '멤버 목록을 불러오지 못했어요.',
          );
        })
        .finally(() => {
          if (!cancelled && reqId === reqIdRef.current) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, roomId, query]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchRoomMembers(roomId, {
        q: query.trim() || undefined,
        cursor: nextCursor,
        limit: 30,
      });
      setMembers((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
      setTotal(page.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '멤버 목록을 불러오지 못했어요.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="방 멤버"
      onClick={onClose}>
      <div
        className="room-sheet flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[18px] sm:rounded-[18px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[rgb(201_166_107/0.18)] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#ebe3d8]">
              이 방 · {loading && members.length === 0 ? '…' : total}명
            </p>
            <p className="truncate text-[12px] text-[#a89880]">{roomName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-full text-[#a89880] hover:bg-[rgb(201_166_107/0.12)]"
            aria-label="닫기">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="border-b border-[rgb(201_166_107/0.12)] px-3 py-2">
          <label className="flex items-center gap-2 rounded-full border border-[rgb(201_166_107/0.22)] bg-[rgb(201_166_107/0.06)] px-3 py-2">
            <Search className="size-3.5 shrink-0 text-[#a89880]" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="닉네임 검색"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#ebe3d8] outline-none placeholder:text-[#a89880]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full p-0.5 text-brand-primary hover:bg-brand-primary-soft"
                aria-label="검색 지우기">
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-brand-primary" />
            </div>
          ) : error ? (
            <p className="px-3 py-8 text-center text-sm text-red-500">
              {error}
            </p>
          ) : members.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[#a89880]">
              {query.trim() ? '검색 결과가 없어요.' : '멤버가 없어요.'}
            </p>
          ) : (
            <>
              <ul className="flex flex-col">
                {members.map((m) => {
                  const mine = m.userId === myUserId;
                  const owner = m.role === 'owner';
                  const isFriend = !mine && friendIds.has(m.userId);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          openSheet({
                            id: m.user.id,
                            nickname: m.user.nickname,
                          });
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-[rgb(201_166_107/0.1)]">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-soft text-brand-primary">
                          <User className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#ebe3d8]">
                          @{m.user.nickname}
                        </span>
                        {owner ? (
                          <span className="shrink-0 rounded-full bg-brand-primary-soft px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                            방장
                          </span>
                        ) : null}
                        {isFriend ? (
                          <span className="shrink-0 rounded-full border border-[rgb(201_166_107/0.28)] px-2 py-0.5 text-[11px] font-medium text-[#a89880]">
                            친구
                          </span>
                        ) : null}
                        {mine ? (
                          <span className="shrink-0 text-[11px] font-medium text-[#a89880]">
                            나
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {nextCursor ? (
                <div className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium text-brand-primary hover:bg-[rgb(201_166_107/0.1)] disabled:opacity-60">
                    {loadingMore ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    더 보기
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
