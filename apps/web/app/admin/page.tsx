'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { adminFetchJson, postAdminStatsSnapshot } from '@/lib/adminFetch';
import type { ApiAdminStats } from '@/lib/apiTypes';
import {
  adminMutedClassName,
  adminOutlineBtnClassName,
  adminPanelClassName,
  authTitleClassName,
} from '@/lib/form';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const chartLoading = <p className={adminMutedClassName}>차트 불러오는 중…</p>;

const VisibleHiddenPie = dynamic(
  () =>
    import('@/components/charts/VisibleHiddenPie').then(
      (m) => m.VisibleHiddenPie,
    ),
  { ssr: false, loading: () => chartLoading },
);

const DailyCountBar = dynamic(
  () =>
    import('@/components/charts/DailyCountBar').then((m) => m.DailyCountBar),
  { ssr: false, loading: () => chartLoading },
);

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [snapshotPending, setSnapshotPending] = useState(false);
  const [snapshotHint, setSnapshotHint] = useState('');

  async function runYesterdaySnapshot() {
    if (snapshotPending) return;
    setSnapshotPending(true);
    setSnapshotHint('');
    setError('');
    try {
      const result = await postAdminStatsSnapshot();
      setSnapshotHint(
        `${result.date} · 글 ${result.recommendations} · 가입 ${result.signups} · 활동 ${result.active}`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '어제 스냅샷을 저장하지 못했어요.',
      );
    } finally {
      setSnapshotPending(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await adminFetchJson<ApiAdminStats>('/stats');
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError('추천 통계를 불러오지 못했어요.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className={authTitleClassName}>
        관리자 대시보드
        {user?.nickname ? (
          <span className={`ml-2 text-base font-normal ${adminMutedClassName}`}>
            @{user.nickname}
          </span>
        ) : null}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={snapshotPending}
          onClick={() => void runYesterdaySnapshot()}
          className={adminOutlineBtnClassName}>
          {snapshotPending ? '스냅샷 중…' : '어제 스냅샷 저장'}
        </button>
        {snapshotHint ? (
          <p className={`text-xs ${adminMutedClassName}`}>{snapshotHint}</p>
        ) : (
          <p className={`text-xs ${adminMutedClassName}`}>
            매일 02:00 KST 자동 · 수동은 어제 일합계만
          </p>
        )}
      </div>

      {isLoading ? (
        <p className={adminMutedClassName}>불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-400" role="alert">
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

          <div className={`${adminPanelClassName} space-y-4 p-4`}>
            <VisibleHiddenPie visible={stats.visible} hidden={stats.hidden} />
            <DailyCountBar data={stats.daily} title="최근 7일 작성" />
            <DailyCountBar data={stats.signupsDaily} title="최근 7일 가입" />
            <DailyCountBar data={stats.activeDaily} title="최근 7일 활동" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${adminPanelClassName} p-4 text-center`}>
      <p className="text-xs text-[color:var(--color-lp-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-primary">{value}</p>
    </div>
  );
}
