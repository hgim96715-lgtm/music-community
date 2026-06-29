'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { adminFetchJson } from '@/lib/adminFetch';
import type { ApiAdminStats } from '@/lib/apiTypes';
import { postCard, postCardShell } from '@/lib/neobrutal';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    adminFetchJson<ApiAdminStats>('/stats')
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError('추천 통계를 불러오지 못했어요.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-primary">
        {user?.nickname}관리자 대시보드
      </h1>
      {isLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="전체" value={stats.total} />
          <StatCard label="공개" value={stats.visible} />
          <StatCard label="숨김" value={stats.hidden} />
          <StatCard label="오늘" value={stats.today} />
        </div>
      ) : null}
      <Link
        href="/admin/recommendations"
        className={`${postCardShell} inline-block px-4 py-3 text-sm font-medium text-brand-primary`}>
        추천 관리 →
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${postCard} p-4 text-center`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-primary">{value}</p>
    </div>
  );
}
