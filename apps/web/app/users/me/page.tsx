'use client';

import { MyHomeDashboard } from '@/components/saved-cards/MyHomeDashboard';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  fetchFriendRequests,
  fetchMyStats,
  fetchSavedCards,
  fetchSavedLyrics,
} from '@/lib/api';
import type { ApiMyStats, ApiSavedCard } from '@/lib/apiTypes';
import { authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 마이 홈 — 대시보드 (친구·설정은 nav 탭) */
export default function MyHomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [savedCards, setSavedCards] = useState<ApiSavedCard[]>([]);
  const [lyricCount, setLyricCount] = useState(0);
  const [lyricPreview, setLyricPreview] = useState<string | null>(null);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);

  const [stats, setStats] = useState<ApiMyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setStatsLoading(true);
      try {
        const data = await fetchMyStats();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setAlbumLoading(true);
      try {
        const [cards, lyrics] = await Promise.all([
          fetchSavedCards(),
          fetchSavedLyrics(),
        ]);
        if (cancelled) return;
        setSavedCards(cards);
        setLyricCount(lyrics.length);
        setLyricPreview(lyrics[0]?.lyricsText.trim() || null);
      } catch {
        if (cancelled) return;
        setSavedCards([]);
        setLyricCount(0);
        setLyricPreview(null);
      } finally {
        if (!cancelled) setAlbumLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const requests = await fetchFriendRequests();
        if (!cancelled) {
          setRequestCount(requests.received.length + requests.sent.length);
        }
      } catch {
        /* ignore */
      }
    }
    void load();
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
          href="/recommendations"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80">
          <ChevronLeft className="size-4" aria-hidden />
          피드
        </Link>
      </div>

      <MyHomeDashboard
        nickname={user.nickname}
        bio={user.bio ?? null}
        cards={savedCards}
        lyricCount={lyricCount}
        lyricPreview={lyricPreview}
        loading={albumLoading}
        requestCount={requestCount}
        stats={stats}
        statsLoading={statsLoading}
      />
    </main>
  );
}
