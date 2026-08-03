'use client';

import { fetchAdminRooms } from '@/lib/adminFetch';
import type { ApiAdminRoom } from '@/lib/apiTypes';
import {
  adminFilterActiveClassName,
  adminFilterIdleClassName,
  adminMutedClassName,
  adminOutlineBtnClassName,
  adminPanelClassName,
  adminSearchInputClassName,
  adminTableHeadRowClassName,
  adminTableRowClassName,
  authTitleClassName,
} from '@/lib/form';
import { useEffect, useState } from 'react';

type StatusFilter = 'all' | 'active' | 'closed' | 'archived';

const STATUS_LABEL: Record<Exclude<StatusFilter, 'all'>, string> = {
  active: '운영',
  closed: '닫힘',
  archived: '보관',
};

export default function AdminRoomsPage() {
  const [rows, setRows] = useState<ApiAdminRoom[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      setIsLoading(true);
      setNextCursor(null);
      try {
        const page = await fetchAdminRooms({
          q: searchQ.trim() || undefined,
          status: status === 'all' ? undefined : status,
          limit: 30,
        });
        if (!cancelled) {
          setRows(page.items);
          setNextCursor(page.nextCursor);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '방 목록을 불러오지 못했어요.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [searchQ, status]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchAdminRooms({
        q: searchQ.trim() || undefined,
        status: status === 'all' ? undefined : status,
        cursor: nextCursor,
        limit: 30,
      });
      setRows((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '방 목록을 불러오지 못했어요.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchQ(q);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={authTitleClassName}>방 관리</h1>
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="방 이름·방장 닉"
            autoComplete="off"
            className={`${adminSearchInputClassName} min-w-0 flex-1 sm:w-56 sm:flex-none`}
          />
          <button type="submit" className={adminOutlineBtnClassName}>
            검색
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', '전체'],
            ['active', '운영'],
            ['closed', '닫힘'],
            ['archived', '보관'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={
              status === value
                ? adminFilterActiveClassName
                : adminFilterIdleClassName
            }>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className={adminMutedClassName}>불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className={adminMutedClassName}>방이 없어요.</p>
      ) : (
        <>
          <div className={`${adminPanelClassName} overflow-x-auto`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className={adminTableHeadRowClassName}>
                  <th className="px-3 py-2.5 font-medium">이름</th>
                  <th className="px-3 py-2.5 font-medium">방장</th>
                  <th className="px-3 py-2.5 font-medium">상태</th>
                  <th className="px-3 py-2.5 font-medium">공개</th>
                  <th className="px-3 py-2.5 font-medium">인원</th>
                  <th className="px-3 py-2.5 font-medium">생성</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={adminTableRowClassName}>
                    <td className="px-3 py-2.5 font-medium text-brand-primary">
                      {row.name}
                      {row.visibility === 'private' ? (
                        <span className="ml-1.5 text-xs text-[color:var(--color-lp-muted)]">
                          비공개
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">@{row.owner.nickname}</td>
                    <td className="px-3 py-2.5">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </td>
                    <td className="px-3 py-2.5 text-[color:var(--color-lp-muted)]">
                      {row.visibility === 'public'
                        ? '공개'
                        : row.visibility === 'private'
                          ? '비공개'
                          : '초대'}
                    </td>
                    <td className="px-3 py-2.5">{row.memberCount}</td>
                    <td className="px-3 py-2.5 text-[color:var(--color-lp-muted)]">
                      {formatDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nextCursor ? (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className="cursor-pointer text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80 disabled:opacity-50">
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
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
