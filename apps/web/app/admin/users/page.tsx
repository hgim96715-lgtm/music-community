'use client';
import { adminFetchJson } from '@/lib/adminFetch';
import type { ApiAdminUser } from '@/lib/apiTypes';
import { postCard } from '@/lib/neobrutal';
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<ApiAdminUser[]>([]);
  const [q, setQ] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [searchQ]);

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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="px-3 py-2 font-medium">닉네임</th>
                <th className="px-3 py-2 font-medium">이메일</th>
                <th className="px-3 py-2 font-medium">가입일</th>
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
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
