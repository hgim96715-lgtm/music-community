'use client';
import { adminFetchJson } from '@/lib/adminFetch';
import type { ApiAdminUser } from '@/lib/apiTypes';
import { postCard } from '@/lib/neobrutal';
import { useEffect, useState } from 'react';

type ActivityFilter = 'all' | 'activeToday' | 'inactive7d';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<ApiAdminUser[]>([]);
  const [q, setQ] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      setError('');
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQ.trim()) {
          params.set('q', searchQ.trim());
        }
        if (activityFilter === 'activeToday') {
          params.set('activeToday', 'true');
        } else if (activityFilter === 'inactive7d') {
          params.set('inactiveDays', '7');
        }
        const path = params.size ? `/users?${params}` : '/users';
        const data = await adminFetchJson<ApiAdminUser[]>(path);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setError('사용자 목록을 불러오지 못했어요.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [searchQ, activityFilter]);

  function handleSearch(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchQ(q);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-brand-primary">
          사용자 관리
        </h1>
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="닉네임·이메일 검색"
            className="min-w-0 flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm sm:w-56 sm:flex-none"
          />
          <button
            type="submit"
            className="shrink-0 whitespace-nowrap rounded-full border border-neutral-200 px-4 py-2 text-sm">
            검색
          </button>
        </form>
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterButton
          active={activityFilter === 'all'}
          onClick={() => setActivityFilter('all')}>
          전체
        </FilterButton>
        <FilterButton
          active={activityFilter === 'activeToday'}
          onClick={() => setActivityFilter('activeToday')}>
          오늘 활동
        </FilterButton>
        <FilterButton
          active={activityFilter === 'inactive7d'}
          onClick={() => setActivityFilter('inactive7d')}>
          7일+ 미접속
        </FilterButton>
      </div>
      {isLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">사용자가 없어요.</p>
      ) : (
        <div className={`${postCard} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="px-3 py-2 font-medium">닉네임</th>
                <th className="px-3 py-2 font-medium">이메일</th>
                <th className="px-3 py-2 font-medium">가입일</th>
                <th className="px-3 py-2 font-medium">마지막 활동</th>
                <th className="px-3 py-2 font-medium">글</th>
                <th className="px-3 py-2 font-medium">role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-brand-primary">
                    @{row.nickname}
                  </td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {row.lastActiveAt ? formatDate(row.lastActiveAt) : '—'}
                  </td>
                  <td className="px-3 py-2">{row._count.recommendations}</td>
                  <td className="px-3 py-2">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm ${
        active
          ? 'border-brand-primary bg-brand-primary-soft text-brand-primary'
          : 'border-neutral-200 text-neutral-600'
      }`}>
      {children}
    </button>
  );
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
