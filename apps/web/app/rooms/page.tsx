'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { authPageClassName } from '@/lib/form';
import { brandPillBtn } from '@/lib/neobrutal';
import { fetchMyRooms, fetchPublicRooms, type ApiRoom } from '@/lib/rooms';
import { ChevronLeft, Loader2, LockIcon, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function roomInitial(room: ApiRoom) {
  const raw = room.name.trim().charAt(0);
  return raw || '♪';
}

function RoomRow({ room }: { room: ApiRoom }) {
  const tags = room.topicTags.slice(0, 2).map((t) => `#${t.replace(/^#/, '')}`);
  const tip = tags.length > 0 ? tags.join(' ') : room.description?.trim();
  const meta = [
    room.owner ? `@${room.owner.nickname}` : null,
    `${room.memberCount}명`,
    tip,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <li>
      <Link
        href={`/rooms/${room.id}`}
        className="flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-neutral-50/80">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#dce8ef] text-[15px] font-semibold text-[#335b73]"
          aria-hidden>
          {roomInitial(room)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold tracking-tight text-neutral-800">
            {room.visibility === 'private' ? (
              <LockIcon
                className="size-3.5 shrink-0 text-neutral-400"
                aria-label="비공개"
              />
            ) : null}
            <span className="truncate">{room.name}</span>
          </p>
          <p className="mt-0.5 truncate text-[13px] leading-snug text-neutral-400">
            {meta}
          </p>
        </div>
      </Link>
    </li>
  );
}

function RoomSection({
  title,
  rooms,
  empty,
}: {
  title: string;
  rooms: ApiRoom[];
  empty: string;
}) {
  return (
    <section className="flex w-full flex-col gap-2">
      <h2 className="px-1 text-[12px] font-semibold tracking-wide text-neutral-400">
        {title}
      </h2>
      {rooms.length === 0 ? (
        <p className="rounded-2xl bg-white/70 px-4 py-8 text-center text-sm text-neutral-400">
          {empty}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(51,91,115,0.06)] divide-y divide-neutral-100/90">
          {rooms.map((room) => (
            <RoomRow key={room.id} room={room} />
          ))}
        </ul>
      )}
    </section>
  );
}

function roomMatchedsQuery(room: ApiRoom, raw: string): boolean {
  const q = raw.trim().replace(/^#/, '').toLowerCase();
  if (!q) return true;
  if (room.name.toLowerCase().includes(q)) return true;
  return room.topicTags.some((t) =>
    t.replace(/^#/, '').toLowerCase().includes(q),
  );
}

function DiscoverSection({ rooms }: { rooms: ApiRoom[] }) {
  const [query, setQuery] = useState('');
  const filtered = rooms.filter((r) => roomMatchedsQuery(r, query));
  const empty =
    rooms.length === 0 ? '새 공개 방이 없어요' : '그런 방은 아직 없어요';
  return (
    <section className="flex w-full flex-col gap-2">
      <h2 className="px-1 text-[12px] font-semibold tracking-wide text-neutral-400">
        둘러보기
      </h2>
      {rooms.length > 0 ? (
        <div className="flex h-10 items-center gap-2 rounded-full bg-white px-3.5 shadow-[0_1px_2px_rgba(51,91,115,0.06)] focus-within:ring-2 focus-within:ring-brand-primary-soft">
          <Search className="size-3.5 shrink-0 text-neutral-300" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="방 이름이나 #재즈…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-neutral-800 outline-none placeholder:text-neutral-300"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="검색어 지우기">
              <X className="size-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white/70 px-4 py-8 text-center text-sm text-neutral-400">
          {empty}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(51,91,115,0.06)] divide-y divide-neutral-100/90">
          {filtered.map((room) => (
            <RoomRow key={room.id} room={room} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [mine, setMine] = useState<ApiRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (authLoading || !user || loading) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  const mineIds = new Set(mine.map((r) => r.id));
  const discover = publicRooms.filter((r) => !mineIds.has(r.id));

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-0.5 rounded-full px-1 py-1 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary">
          <ChevronLeft className="size-4" aria-hidden />
          피드
        </Link>
        <Link
          href="/rooms/new"
          className="inline-flex items-center gap-1 rounded-full bg-brand-primary-soft px-3 py-1.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-[#c5d9e6]">
          <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
          만들기
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-800">
          방
        </h1>
        <p className="text-sm text-neutral-400">같이 듣는 공간</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <RoomSection title="내 방" rooms={mine} empty="아직 들어간 방이 없어요" />
      <DiscoverSection rooms={discover} />

      {mine.length === 0 ? (
        <Link href="/rooms/new" className={`${brandPillBtn} mt-1 text-center`}>
          첫 방 만들기
        </Link>
      ) : null}
    </main>
  );
}
