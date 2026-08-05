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
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function AdminRecommendationsPage() {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [rows, setRows] = useState<ApiAdminRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')?.trim();
    setFocusId(id || null);
  }, []);

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

  const visibleRows = useMemo(() => {
    if (!focusId) return rows;
    return rows.filter((row) => row.id === focusId);
  }, [rows, focusId]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={authTitleClassName}>추천 관리</h1>
        {focusId ? (
          <Link
            href="/admin/recommendations"
            className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
            전체 목록
          </Link>
        ) : null}
      </div>
      {focusId ? (
        <p className={adminMutedClassName}>
          신고에서 연 글만 보여요. 없으면 삭제되었거나 id가 달라요.
        </p>
      ) : null}
      {isLoading ? (
        <p className={adminMutedClassName}>불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : visibleRows.length === 0 ? (
        <p className={adminMutedClassName}>
          {focusId ? '해당 추천 글이 없어요.' : '추천 글이 없어요.'}
        </p>
      ) : (
        <div className="space-y-4">
          {focusId
            ? visibleRows.map((row) => (
                <div
                  key={`detail-${row.id}`}
                  className={`${adminPanelClassName} space-y-3 p-4`}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-base font-semibold text-brand-primary">
                      {row.title}
                    </p>
                    <p className="text-sm text-[color:var(--color-lp-muted)]">
                      {row.artist}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-[color:var(--color-lp-muted)]">
                    id · {row.id}
                  </p>
                  <p className="text-sm text-[color:var(--color-lp-cream)]">
                    작성자{' '}
                    <span className="font-medium">@{row.author.nickname}</span>
                    {row.hidden ? (
                      <span className="ml-2 text-[color:var(--color-lp-muted)]">
                        · 숨김
                      </span>
                    ) : null}
                  </p>
                  <div>
                    <p className="mb-1 text-xs font-medium text-[color:var(--color-lp-muted)]">
                      추천 이유 · 본문
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[color:var(--color-lp-cream)]">
                      {row.reason}
                    </p>
                  </div>
                  {row.moods?.length ? (
                    <p className="text-xs text-[color:var(--color-lp-muted)]">
                      분위기 · {row.moods.join(', ')}
                    </p>
                  ) : null}
                  {row.embedUrl ? (
                    <a
                      href={row.embedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-medium text-brand-primary hover:text-brand-primary/80">
                      임베드 열기
                    </a>
                  ) : null}
                </div>
              ))
            : null}

          <div className={`${adminPanelClassName} overflow-x-auto`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className={adminTableHeadRowClassName}>
                  <th className="px-3 py-2.5 font-medium">id</th>
                  <th className="px-3 py-2.5 font-medium">제목</th>
                  <th className="px-3 py-2.5 font-medium">아티스트</th>
                  <th className="px-3 py-2.5 font-medium">작성자</th>
                  {!focusId ? (
                    <th className="px-3 py-2.5 font-medium">본문</th>
                  ) : null}
                  <th className="px-3 py-2.5 font-medium">상태</th>
                  <th className="px-3 py-2.5 font-medium">좋아요</th>
                  <th className="px-3 py-2.5 font-medium">작성일</th>
                  <th className="px-3 py-2.5 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const busy = pendingId === row.id;
                  return (
                    <tr key={row.id} className={adminTableRowClassName}>
                      <td className="px-3 py-2.5 font-mono text-xs text-[color:var(--color-lp-muted)]">
                        <span title={row.id}>{row.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-brand-primary">
                        {row.title}
                      </td>
                      <td className="px-3 py-2.5 text-[color:var(--color-lp-cream)]">
                        {row.artist}
                      </td>
                      <td className="px-3 py-2.5 text-[color:var(--color-lp-cream)]">
                        @{row.author.nickname}
                      </td>
                      {!focusId ? (
                        <td className="max-w-[240px] px-3 py-2.5">
                          <p className="line-clamp-2 whitespace-pre-wrap break-words text-[color:var(--color-lp-cream)]">
                            {row.reason}
                          </p>
                        </td>
                      ) : null}
                      <td className="px-3 py-2.5">
                        {row.hidden ? (
                          <span className="text-[color:var(--color-lp-muted)]">
                            숨김
                          </span>
                        ) : (
                          <span className="text-brand-primary">공개</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[color:var(--color-lp-cream)]">
                        {row.reactions.length}
                      </td>
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
