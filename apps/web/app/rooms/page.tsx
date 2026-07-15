'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  appNavLinkClassName,
  authPageClassName,
  authTitleClassName,
} from '@/lib/form';
import { brandPillBtn } from '@/lib/neobrutal';
import { fetchMyRooms, fetchPublicRooms, type ApiRoom } from '@/lib/rooms';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function RoomCard({ room }: { room: ApiRoom }) {
  return (
    <li>
      <Link
        href={`/rooms/${room.id}`}
        className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(51,91,115,0.07)] transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(51,91,115,0.12)] active:translate-y-0 active:shadow-[0_1px_3px_rgba(51,91,115,0.07)]">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-neutral-800">
            {room.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-neutral-400">
            {room.owner
              ? `@${room.owner.nickname} · ${room.memberCount}명`
              : `${room.memberCount}명`}
          </p>
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-neutral-300"
          aria-hidden
        />
      </Link>
    </li>
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
    <main className={`${authPageClassName} gap-6`}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          피드
        </Link>
        <Link href="/rooms/new" className={appNavLinkClassName}>
          만들기 →
        </Link>
      </div>
      <h1 className={authTitleClassName}>방</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="flex w-full flex-col gap-2.5">
        <h2 className="px-0.5 text-[11px] font-medium tracking-wide text-neutral-400">
          내 방
        </h2>
        {mine.length === 0 ? (
          <p className="text-sm text-neutral-400">아직 들어간 방이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {mine.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex w-full flex-col gap-2.5">
        <h2 className="px-0.5 text-[11px] font-medium tracking-wide text-neutral-400">
          둘러보기
        </h2>
        {discover.length === 0 ? (
          <p className="text-sm text-neutral-400">새 공개 방이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {discover.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </ul>
        )}
      </section>

      <Link href="/rooms/new" className={`${brandPillBtn} text-center`}>
        새 방 만들기
      </Link>
    </main>
  );
}
