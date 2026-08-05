'use client';

import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { fetchAdminReports, patchAdminReportStatus } from '@/lib/adminFetch';
import type { ApiAdminReport, ApiAdminReportTarget } from '@/lib/apiTypes';
import {
  adminFilterActiveClassName,
  adminFilterIdleClassName,
  adminMutedClassName,
  adminOutlineBtnClassName,
  adminPanelClassName,
  adminTableHeadRowClassName,
  adminTableRowClassName,
  authTitleClassName,
} from '@/lib/form';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type StatusFilter = 'all' | 'pending' | 'resolved' | 'dismissed';
type TargetFilter = 'all' | 'comment' | 'room_message' | 'recommendation';

const STATUS_LABEL: Record<Exclude<StatusFilter, 'all'>, string> = {
  pending: '미처리',
  resolved: '처리',
  dismissed: '기각',
};

const TARGET_LABEL: Record<Exclude<TargetFilter, 'all'>, string> = {
  comment: '댓글',
  room_message: '방 메시지',
  recommendation: '피드',
};

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ApiAdminReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [targetType, setTargetType] = useState<TargetFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    row: ApiAdminReport;
    next: 'resolved' | 'dismissed';
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      setIsLoading(true);
      setNextCursor(null);
      try {
        const page = await fetchAdminReports({
          status: status === 'all' ? undefined : status,
          targetType: targetType === 'all' ? undefined : targetType,
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
              : '신고 목록을 불러오지 못했어요.',
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
  }, [status, targetType]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchAdminReports({
        status: status === 'all' ? undefined : status,
        targetType: targetType === 'all' ? undefined : targetType,
        cursor: nextCursor,
        limit: 30,
      });
      setRows((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '신고 목록을 불러오지 못했어요.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function confirmUpdate() {
    if (!confirm || updatingId) return;
    const { row, next } = confirm;
    setUpdatingId(row.id);
    setError('');
    try {
      const updated = await patchAdminReportStatus(row.id, next);
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? updated : item)),
      );
      setConfirm(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '신고를 처리하지 못했어요.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const confirmLabel = confirm?.next === 'resolved' ? '처리' : '기각';

  return (
    <div className="space-y-6">
      <h1 className={authTitleClassName}>신고 큐</h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['pending', '미처리'],
            ['all', '전체'],
            ['resolved', '처리'],
            ['dismissed', '기각'],
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

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', '대상 전체'],
            ['recommendation', '피드'],
            ['comment', '댓글'],
            ['room_message', '방 메시지'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTargetType(value)}
            className={
              targetType === value
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
        <p className={adminMutedClassName}>신고가 없어요.</p>
      ) : (
        <>
          <div className={`${adminPanelClassName} overflow-x-auto`}>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className={adminTableHeadRowClassName}>
                  <th className="px-3 py-2.5 font-medium">대상</th>
                  <th className="px-3 py-2.5 font-medium">원문</th>
                  <th className="px-3 py-2.5 font-medium">신고자 / 작성자</th>
                  <th className="px-3 py-2.5 font-medium">사유</th>
                  <th className="px-3 py-2.5 font-medium">상태</th>
                  <th className="px-3 py-2.5 font-medium">접수</th>
                  <th className="px-3 py-2.5 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={adminTableRowClassName}>
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-brand-primary">
                        {TARGET_LABEL[row.targetType]}
                      </span>
                      <p className="mt-0.5 font-mono text-xs text-[color:var(--color-lp-muted)]">
                        {row.targetId.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="max-w-[320px] px-3 py-2.5">
                      <TargetPreview row={row} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[color:var(--color-lp-cream)]">
                        @{row.reporter.nickname}
                      </span>
                      <span className="mx-1.5 text-[color:var(--color-lp-muted)]">
                        →
                      </span>
                      <span className="text-[color:var(--color-lp-cream)]">
                        @{targetAuthorNickname(row) ?? '—'}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-3 py-2.5 whitespace-pre-wrap break-words text-[color:var(--color-lp-cream)]">
                      {row.reason}
                    </td>
                    <td className="px-3 py-2.5">{STATUS_LABEL[row.status]}</td>
                    <td className="px-3 py-2.5 text-[color:var(--color-lp-muted)]">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.status === 'pending' ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === row.id}
                            onClick={() =>
                              setConfirm({ row, next: 'resolved' })
                            }
                            className="cursor-pointer rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-[color:var(--color-lp-ink)] transition-colors hover:bg-brand-primary/90 disabled:opacity-50">
                            처리
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === row.id}
                            onClick={() =>
                              setConfirm({ row, next: 'dismissed' })
                            }
                            className={adminOutlineBtnClassName}>
                            기각
                          </button>
                        </div>
                      ) : (
                        <span className={adminMutedClassName}>—</span>
                      )}
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

      <FeedDialog
        open={confirm != null}
        title={
          confirm?.next === 'resolved'
            ? '이 신고를 처리 완료할까요?'
            : '이 신고를 기각할까요?'
        }
        description={
          confirm?.next === 'resolved'
            ? '조치(숨김·삭제 등)는 각 Admin 화면에서 따로 해요. 여기선 큐만 닫아요.'
            : '사유가 없거나 무시할 때. 대상 글은 그대로일 수 있어요.'
        }
        confirmLabel={confirmLabel}
        pendingLabel={`${confirmLabel} 중…`}
        isPending={updatingId != null}
        onClose={() => {
          if (!updatingId) setConfirm(null);
        }}
        onConfirm={() => void confirmUpdate()}
      />
    </div>
  );
}

function targetHref(row: ApiAdminReport): string | null {
  const t = row.target;
  if (!t) return null;
  if (t.kind === 'recommendation') {
    return `/admin/recommendations?id=${row.targetId}`;
  }
  if (t.kind === 'comment') {
    return `/admin/recommendations?id=${t.recommendationId}`;
  }
  return `/admin/rooms?id=${t.roomId}&messageId=${row.targetId}`;
}

function TargetPreview({ row }: { row: ApiAdminReport }) {
  const t = row.target;
  if (!t || row.targetMissing) {
    return (
      <p className={adminMutedClassName}>삭제되었거나 찾을 수 없습니다.</p>
    );
  }
  const href = targetHref(row);
  return (
    <div className="space-y-1">
      <p className="line-clamp-3 whitespace-pre-wrap break-words text-[color:var(--color-lp-cream)]">
        {previewText(t)}
      </p>
      {t.kind === 'recommendation' && t.hidden ? (
        <p className="text-xs text-[color:var(--color-lp-muted)]">숨김</p>
      ) : null}
      {t.kind === 'comment' && t.recommendationTitle ? (
        <p className="text-xs text-[color:var(--color-lp-muted)]">
          글 · {t.recommendationTitle}
        </p>
      ) : null}
      {t.kind === 'room_message' ? (
        <p className="text-xs text-[color:var(--color-lp-muted)]">
          {t.roomName ?? '방'}
          {t.deletedAt ? ' · 삭제됨' : ''}
        </p>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="inline-block text-xs font-medium text-brand-primary hover:text-brand-primary/80">
          원문 보기
        </Link>
      ) : null}
    </div>
  );
}

function targetAuthorNickname(row: ApiAdminReport) {
  const t = row.target;
  if (!t) return null;
  if (t.kind === 'recommendation' || t.kind === 'comment') {
    return t.author.nickname;
  }
  return t.sender.nickname;
}

function previewText(t: ApiAdminReportTarget) {
  if (t.kind === 'recommendation') {
    return `${t.title} — ${t.artist}\n${t.reason}`;
  }
  if (t.kind === 'comment') return t.body;
  return t.body?.trim()
    ? t.body
    : '(본문 없음 · 삭제된 메시지일 수 있음)';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
