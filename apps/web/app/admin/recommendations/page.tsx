'use client';
import { adminFetchJson, adminFetchVoid } from '@/lib/adminFetch';
import type { ApiAdminRecommendation } from '@/lib/apiTypes';
import { postCard } from '@/lib/neobrutal';
import { useCallback, useEffect, useState } from 'react';

export default function AdminRecommendationsPage() {
  const [rows, setRows] = useState<ApiAdminRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data =
        await adminFetchJson<ApiAdminRecommendation[]>('/recommendations');
      setRows(data);
    } catch {
      setError('추천 목록을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      await adminFetchVoid(`/recommendations/${id}`, {
        method: 'DELETE',
      });
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch {
      setError('추천을 삭제하지 못했어요.');
    } finally {
      setPendingId(null);
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-primary">추천 관리</h1>
      {isLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">추천 글이 없어요.</p>
      ) : (
        <div className={`${postCard} overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="px-3 py-2 font-medium">제목</th>
                <th className="px-3 py-2 font-medium">아티스트</th>
                <th className="px-3 py-2 font-medium">상태</th>
                <th className="px-3 py-2 font-medium">좋아요</th>
                <th className="px-3 py-2 font-medium">작성일</th>
                <th className="px-3 py-2 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = pendingId === row.id;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-brand-primary">
                      {row.title}
                    </td>
                    <td className="px-3 py-2">{row.artist}</td>
                    <td className="px-3 py-2">
                      {row.hidden ? (
                        <span className="text-neutral-400">숨김</span>
                      ) : (
                        <span className="text-brand-primary">공개</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.reactions.length}</td>
                    <td className="px-3 py-2 text-neutral-500">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleHidden(row)}
                          className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs disabled:opacity-50">
                          {row.hidden ? '복구' : '숨김'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(row.id, row.title)}
                          className="rounded-full border border-red-200 px-2.5 py-1 text-xs text-red-600 disabled:opacity-50">
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
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
