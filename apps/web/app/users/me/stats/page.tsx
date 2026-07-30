'use client';
import { MyStatsCharts } from '@/components/charts/MyStatsCharts';
import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriendRequests, fetchMyStats } from '@/lib/api';
import { authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ApiMyStats } from '@/lib/apiTypes';

export default function MyStatsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [stats, setStats] = useState<ApiMyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/stats');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchFriendRequests()
      .then((requests) => {
        if (!cancelled)
          setRequestCount(requests.received.length + requests.sent.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatsLoading(true);
    fetchMyStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
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
        title="통계"
        subtitle="활동 · 태그 · 가수"
        active="stats"
        requestCount={requestCount}>
        {statsLoading || !stats ? (
          <div className="grid min-h-72 place-items-center">
            <span className="inline-flex items-center gap-2 text-xs text-[#a89880]">
              <Loader2 className="size-4 animate-spin text-brand-primary" />
              통계 불러오는 중…
            </span>
          </div>
        ) : (
          <MyStatsCharts stats={stats} />
        )}
      </MyHomeSubShell>
    </main>
  );
}
