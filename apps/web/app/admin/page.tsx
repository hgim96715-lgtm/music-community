'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { adminFetchJson } from '@/lib/adminFetch';
import type { ApiAdminStats } from '@/lib/apiTypes';
import { postCard } from '@/lib/neobrutal';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const VisibleHiddenPie = dynamic(
  () =>
    import('@/components/charts/VisibleHiddenPie').then(
      (m) => m.VisibleHiddenPie,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-neutral-500">차트 불러오는 중…</p>
    ),
  },
);

const DailyCountBar = dynamic(
  () =>
    import('@/components/charts/DailyCountBar').then((m) => m.DailyCountBar),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-neutral-500">차트 불러오는 중…</p>
    ),
  },
);

const ActivityLineChart = dynamic(
  () =>
    import('@/components/charts/ActivityLineChart').then(
      (m) => m.ActivityLineChart,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-neutral-500">차트 불러오는 중…</p>
    ),
  },
);

const MonthlyCountBar = dynamic(
  () =>
    import('@/components/charts/MonthlyCountBar').then(
      (m) => m.MonthlyCountBar,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-neutral-500">차트 불러오는 중…</p>
    ),
  },
);

const HourlyCountBar = dynamic(
  () =>
    import('@/components/charts/HourlyCountBar').then((m) => m.HourlyCountBar),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-neutral-500">차트 불러오는 중…</p>
    ),
  },
);

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
        관리자 대시보드
        {user?.nickname ? (
          <span className="ml-2 text-base font-normal text-neutral-500">
            @{user.nickname}
          </span>
        ) : null}
      </h1>

      {isLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="전체" value={stats.total} />
            <StatCard label="공개" value={stats.visible} />
            <StatCard label="숨김" value={stats.hidden} />
            <StatCard label="오늘 작성" value={stats.today} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="전체 회원" value={stats.usersTotal} />
            <StatCard label="오늘 가입" value={stats.signupsToday} />
            <StatCard label="오늘 활동" value={stats.activeToday} />
            <StatCard label="7일+ 미접속" value={stats.inactive7d} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <StatCard label="전체 회원" value={stats.usersTotal} />
            <StatCard label="오늘 가입" value={stats.signupsToday} />
          </div>

          <VisibleHiddenPie visible={stats.visible} hidden={stats.hidden} />
          <DailyCountBar data={stats.daily} title="최근 7일 작성" />
          <DailyCountBar data={stats.signupsDaily} title="최근 7일 가입" />
          <DailyCountBar data={stats.activeDaily} title="최근 7일 활동" />
        </div>
      ) : null}
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
