import Link from 'next/link';
import { adminFetchJson } from '@/lib/adminFetch';
import type { ApiAdminStats } from '@/lib/apiTypes';
import AdminStatsChart from './AdminStatsChart';

export default async function AdminPage() {
  const stats = await adminFetchJson<ApiAdminStats>('/admin/stats', {
    cache: 'no-store',
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">
        관리자 대시보드
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        추천 글 운영 · 숨김 · 삭제
      </p>

      {/* 숫자 카드 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체" value={stats.total} />
        <StatCard label="공개" value={stats.visible} />
        <StatCard label="숨김" value={stats.hidden} />
        <StatCard label="오늘 작성" value={stats.today} />
      </div>

      {/* 기존 링크 카드 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/recommendations"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300">
          <p className="text-sm font-medium text-neutral-900">추천 관리</p>
          <p className="mt-1 text-xs text-neutral-500">전체 목록 · 숨김 포함</p>
        </Link>
      </div>

      <div className="mt-6">
        <AdminStatsChart visible={stats.visible} hidden={stats.hidden} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
