'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoomCoverCard } from '@/components/rooms/RoomCoverCard';
import { authPageClassName } from '@/lib/form';
import { brandPillBtn } from '@/lib/neobrutal';
import { hasUnreadChat } from '@/lib/roomChatUnreadStorage';
import { fetchMyRooms, fetchPublicRooms, type ApiRoom } from '@/lib/rooms';
import { ChevronLeft, Loader2, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type RoomsTab = 'mine' | 'discover';

function roomMatchesQuery(room: ApiRoom, raw: string): boolean {
  const q = raw.trim().replace(/^#/, '').toLowerCase();
  if (!q) return true;
  if (room.name.toLowerCase().includes(q)) return true;
  return room.topicTags.some((t) =>
    t.replace(/^#/, '').toLowerCase().includes(q),
  );
}

function RoomGrid({
  rooms,
  empty,
  userId,
  showUnread = false,
}: {
  rooms: ApiRoom[];
  empty: string;
  userId?: string;
  showUnread?: boolean;
}) {
  if (rooms.length === 0) {
    return (
      <p className="rounded-2xl bg-[color:var(--color-lp-paper)]/80 px-4 py-8 text-center text-sm text-[color:var(--color-lp-muted)]">
        {empty}
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-5">
      {rooms.map((room) => (
        <RoomCoverCard
          key={room.id}
          room={room}
          unread={
            showUnread && userId
              ? hasUnreadChat(userId, room.id, room.lastMessageAt ?? null)
              : false
          }
        />
      ))}
    </ul>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [mine, setMine] = useState<ApiRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<RoomsTab>('mine');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [myRooms, nextPublicRooms] = await Promise.all([
        fetchMyRooms(),
        fetchPublicRooms(),
      ]);
      setMine(myRooms);
      setPublicRooms(nextPublicRooms);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '방 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/rooms');
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  const mineIds = useMemo(() => new Set(mine.map((r) => r.id)), [mine]);
  const discover = useMemo(
    () => publicRooms.filter((r) => !mineIds.has(r.id)),
    [publicRooms, mineIds],
  );
  const filteredDiscover = useMemo(
    () => discover.filter((r) => roomMatchesQuery(r, query)),
    [discover, query],
  );
  const mineHasUnread = useMemo(() => {
    if (!user) return false;
    return mine.some((r) =>
      hasUnreadChat(user.id, r.id, r.lastMessageAt ?? null),
    );
  }, [mine, user]);

  if (authLoading || !user || loading) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-0.5 rounded-full px-1 py-1 text-sm font-medium text-[color:var(--color-lp-muted)] transition-colors hover:text-brand-primary">
          <ChevronLeft className="size-4" aria-hidden />
          피드
        </Link>
        <Link
          href="/rooms/new"
          className="inline-flex items-center gap-1 rounded-full bg-brand-primary-soft px-3 py-1.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20">
          <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
          만들기
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-brand-primary">
          방
        </h1>
        <p className="text-sm text-[color:var(--color-lp-muted)]">
          판을 골라 같이 들어요
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div
        role="tablist"
        aria-label="방 목록"
        className="flex rounded-full bg-[color:var(--color-lp-paper)]/12 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'mine'}
          onClick={() => setTab('mine')}
          className={`relative flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            tab === 'mine'
              ? 'bg-[color:var(--color-lp-paper)] text-[color:var(--color-lp-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
              : 'text-[color:var(--color-lp-muted)] hover:text-brand-primary'
          }`}>
          내 방
          {mineHasUnread ? (
            <span
              className="absolute right-3 top-2 size-1.5 rounded-full bg-brand-primary"
              aria-hidden
            />
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'discover'}
          onClick={() => setTab('discover')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            tab === 'discover'
              ? 'bg-[color:var(--color-lp-paper)] text-[color:var(--color-lp-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
              : 'text-[color:var(--color-lp-muted)] hover:text-brand-primary'
          }`}>
          둘러보기
        </button>
      </div>

      {tab === 'mine' ? (
        <div role="tabpanel" className="flex flex-col gap-4">
          <RoomGrid
            rooms={mine}
            empty="아직 들어간 방이 없어요"
            userId={user.id}
            showUnread
          />
          {mine.length === 0 ? (
            <Link
              href="/rooms/new"
              className={`${brandPillBtn} text-center`}>
              첫 방 만들기
            </Link>
          ) : null}
        </div>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-3">
          {discover.length > 0 ? (
            <div className="flex h-10 items-center gap-2 rounded-full bg-[color:var(--color-lp-paper)] px-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.2)] focus-within:ring-2 focus-within:ring-brand-primary/30">
              <Search
                className="size-3.5 shrink-0 text-[color:var(--color-lp-muted)]"
                aria-hidden
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="방 이름이나 #재즈…"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[color:var(--color-lp-ink)] outline-none placeholder:text-[color:var(--color-lp-muted)]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-[color:var(--color-lp-muted)] hover:bg-brand-primary-soft hover:text-brand-primary"
                  aria-label="검색어 지우기">
                  <X className="size-4" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          ) : null}
          <RoomGrid
            rooms={filteredDiscover}
            empty={
              discover.length === 0
                ? '새 방이 없어요'
                : '그런 방은 아직 없어요'
            }
          />
        </div>
      )}
    </main>
  );
}
