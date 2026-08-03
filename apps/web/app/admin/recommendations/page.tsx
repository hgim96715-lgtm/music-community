'use client';

import { adminFetchJson, adminFetchVoid } from '@/lib/adminFetch';
import type { ApiAdminRecommendation } from '@/lib/apiTypes';
import {
  adminMutedClassName,
  adminOutlineBtnClassName,
  adminPanelClassName,
  adminTableHeadRowClassName,
  adminTableRowClassName,
  authTitleClassName,
} from '@/lib/form';
import { useEffect, useState } from 'react';

export default function AdminRecommendationsPage() {
  const [rows, setRows] = useState<ApiAdminRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRecommendations() {
      setError('');
      setIsLoading(true);
      try {
        const data =
          await adminFetchJson<ApiAdminRecommendation[]>('/recommendations');
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setError('추천 목록을 불러오지 못했어요.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleHidden(row: ApiAdminRecommendation) {
    setPendingId(row.id);
    try {
      await adminFetchVoid(`/recommendations/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !row.hidden }),
      });
      setRows((prev) =>
        prev.map((prevRow) =>
          prevRow.id === row.id
            ? { ...prevRow, hidden: !prevRow.hidden }
            : prevRow,
        ),
      );
    } catch {
      setError('추천 숨김 상태를 변경하지 못했어요.');
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`${title}을 삭제하시겠습니까?`)) return;
    setPendingId(id);
    try {
      await adminFetchVoid(`/recommendations/${id}`, { method: 'DELETE' });
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch {
      setError('추천을 삭제하지 못했어요.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className={authTitleClassName}>추천 관리</h1>
      {isLoading ? (
        <p className={adminMutedClassName}>불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className={adminMutedClassName}>추천 글이 없어요.</p>
      ) : (
        <div className={`${adminPanelClassName} overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={adminTableHeadRowClassName}>
                <th className="px-3 py-2.5 font-medium">제목</th>
                <th className="px-3 py-2.5 font-medium">아티스트</th>
                <th className="px-3 py-2.5 font-medium">상태</th>
                <th className="px-3 py-2.5 font-medium">좋아요</th>
                <th className="px-3 py-2.5 font-medium">작성일</th>
                <th className="px-3 py-2.5 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = pendingId === row.id;
                return (
                  <tr key={row.id} className={adminTableRowClassName}>
                    <td className="px-3 py-2.5 font-medium text-brand-primary">
                      {row.title}
                    </td>
                    <td className="px-3 py-2.5">{row.artist}</td>
                    <td className="px-3 py-2.5">
                      {row.hidden ? (
                        <span className="text-[color:var(--color-lp-muted)]">
                          숨김
                        </span>
                      ) : (
                        <span className="text-brand-primary">공개</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{row.reactions.length}</td>
                    <td className="px-3 py-2.5 text-[color:var(--color-lp-muted)]">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleHidden(row)}
                          className={adminOutlineBtnClassName}>
                          {row.hidden ? '복구' : '숨김'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(row.id, row.title)}
                          className="cursor-pointer rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
