'use client';

import { SavedCardAlbumBook } from '@/components/saved-cards/SavedCardAlbumBook';
import { SavedCardAlbumModal } from '@/components/saved-cards/SavedCardAlbumModal';
import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriendRequests, fetchSavedCards } from '@/lib/api';
import type { ApiSavedCard } from '@/lib/apiTypes';
import { authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 내 앨범 — Top3 + 책장 */
export default function MyAlbumPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [savedCards, setSavedCards] = useState<ApiSavedCard[]>([]);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [albumError, setAlbumError] = useState('');
  const [selected, setSelected] = useState<ApiSavedCard | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/album');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setAlbumLoading(true);
    setAlbumError('');
    fetchSavedCards()
      .then((cards) => {
        if (!cancelled) setSavedCards(cards);
      })
      .catch((err) => {
        if (!cancelled) {
          setAlbumError(
            err instanceof Error ? err.message : '앨범을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAlbumLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchFriendRequests()
      .then((requests) => {
        if (!cancelled) {
          setRequestCount(requests.received.length + requests.sent.length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div>
        <Link
          href="/users/me"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          마이 홈
        </Link>
      </div>

      <MyHomeSubShell
        nickname={user.nickname}
        title="내 앨범"
        subtitle="LP Top 3 · 책장"
        active={null}
        requestCount={requestCount}>
        {/* 책장 — embedded */}
        <div className="-mx-1">
          <SavedCardAlbumBook
            embedded
            cards={savedCards}
            loading={albumLoading}
            error={albumError}
            onSelectCard={setSelected}
            onCardsChange={setSavedCards}
          />
        </div>
      </MyHomeSubShell>

      <SavedCardAlbumModal
        card={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onDeleted={(id) => {
          setSavedCards((prev) => prev.filter((c) => c.id !== id));
          setSelected(null);
        }}
        onUpdated={(updated) => {
          setSavedCards((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c)),
          );
          setSelected(updated);
        }}
      />
    </main>
  );
}
