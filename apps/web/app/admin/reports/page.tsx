'use client';

import { FeedDialog } from '@/components/recommendations/FeedDialog';
import {
  deleteAdminComment,
  deleteAdminRoomMessage,
  fetchAdminReports,
  patchAdminReportStatus,
} from '@/lib/adminFetch';
import type { ApiAdminReport, ApiAdminReportTarget } from '@/lib/apiTypes';
import {
  adminFilterActiveClassName,
  adminFilterIdleClassName,
  adminMutedClassName,
  adminOutlineBtnClassName,
  adminPanelClassName,
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
    deleteMessage?: boolean;
    deleteComment?: boolean;
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
    const { row, next, deleteMessage, deleteComment } = confirm;
    setUpdatingId(row.id);
    setError('');
    let contentDeleted = Boolean(
      (deleteMessage &&
        row.target?.kind === 'room_message' &&
        row.target.deletedAt) ||
      (deleteComment && row.targetMissing),
    );
    try {
      if (deleteMessage) {
        const t = row.target;
        if (!t || t.kind !== 'room_message') {
          throw new Error('방 메시지 원문을 찾을 수 없어요.');
        }
        if (!t.deletedAt) {
          await deleteAdminRoomMessage(t.roomId, row.targetId);
          contentDeleted = true;
          setRows((prev) =>
            prev.map((item) => {
              if (item.id !== row.id) return item;
              if (!item.target || item.target.kind !== 'room_message') {
                return item;
              }
              return {
                ...item,
                target: {
                  ...item.target,
                  body: null,
                  deletedAt: new Date().toISOString(),
                },
              };
            }),
          );
        }
      }
      if (deleteComment) {
        const t = row.target;
        if (!t || t.kind !== 'comment') {
          throw new Error('댓글 원문을 찾을 수 없어요.');
        }
        await deleteAdminComment(t.recommendationId, row.targetId);
        contentDeleted = true;
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? { ...item, target: null, targetMissing: true }
              : item,
          ),
        );
      }
      const updated = await patchAdminReportStatus(row.id, next);
      setRows((prev) => {
        if (status === 'pending') {
          return prev.filter((item) => item.id !== row.id);
        }
        return prev.map((item) => {
          if (item.id !== row.id) return item;
          if (deleteComment) {
            return { ...updated, target: null, targetMissing: true };
          }
          if (
            !deleteMessage ||
            !item.target ||
            item.target.kind !== 'room_message'
          ) {
            return updated;
          }
          return {
            ...updated,
            target: {
              ...item.target,
              body: null,
              deletedAt: item.target.deletedAt ?? new Date().toISOString(),
            },
            targetMissing: false,
          };
        });
      });
      setConfirm(null);
    } catch (error) {
      const base =
        error instanceof Error ? error.message : '신고를 처리하지 못했어요.';
      const deletedKind = deleteComment
        ? '댓글'
        : deleteMessage
          ? '메시지'
          : null;
      setError(
        contentDeleted && deletedKind && next === 'resolved'
          ? `${deletedKind}은 삭제됐어요. 신고 큐 닫기에 실패했어요 — 「처리」로 다시 닫아 주세요. (${base})`
          : base,
      );
      if (contentDeleted && (deleteMessage || deleteComment)) {
        setConfirm(null);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const confirmLabel = confirm?.next === 'resolved' ? '처리' : '기각';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div>
        <h1 className={authTitleClassName}>신고 큐</h1>
        <p className={`mt-1 ${adminMutedClassName}`}>
          원문 확인 후 조치하거나 기각해요.
        </p>
      </div>

      <div className="space-y-3">
        <FilterRow
          label="상태"
          options={
            [
              ['pending', '미처리'],
              ['all', '전체'],
              ['resolved', '처리'],
              ['dismissed', '기각'],
            ] as const
          }
          value={status}
          onChange={setStatus}
        />
        <FilterRow
          label="대상"
          options={
            [
              ['all', '전체'],
              ['recommendation', '피드'],
              ['comment', '댓글'],
              ['room_message', '방 메시지'],
            ] as const
          }
          value={targetType}
          onChange={setTargetType}
        />
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-300"
          role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className={adminMutedClassName}>불러오는 중…</p>
      ) : rows.length === 0 ? (
        <div className={`${adminPanelClassName} px-4 py-10 text-center`}>
          <p className={adminMutedClassName}>신고가 없어요.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <ReportCard
                  row={row}
                  busy={updatingId === row.id}
                  onResolve={(opts) =>
                    setConfirm({
                      row,
                      next: 'resolved',
                      deleteMessage: opts?.deleteMessage,
                      deleteComment: opts?.deleteComment,
                    })
                  }
                  onDismiss={() => setConfirm({ row, next: 'dismissed' })}
                />
              </li>
            ))}
          </ul>
          {nextCursor ? (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:opacity-50">
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            </div>
          ) : null}
        </>
      )}

      <FeedDialog
        open={confirm != null}
        title={
          confirm?.next === 'dismissed'
            ? '이 신고를 기각할까요?'
            : confirm?.deleteMessage
              ? '메시지를 삭제하고 처리할까요?'
              : confirm?.deleteComment
                ? '댓글을 삭제하고 처리할까요?'
                : '이 신고를 처리 완료할까요?'
        }
        description={
          confirm?.next === 'dismissed'
            ? '사유가 없거나 무시할 때. 대상 글은 그대로일 수 있어요.'
            : confirm?.deleteMessage
              ? '방 멤버 전원에게서 메시지를 지운 뒤 이 신고를 처리 완료로 닫아요.'
              : confirm?.deleteComment
                ? '댓글을 지운 뒤 이 신고를 처리 완료로 닫아요.'
                : '이미 삭제됐거나 조치가 끝난 경우. 큐만 닫아요.'
        }
        confirmLabel={
          confirm?.deleteMessage || confirm?.deleteComment
            ? '삭제 후 처리'
            : confirmLabel
        }
        pendingLabel={
          confirm?.deleteMessage || confirm?.deleteComment
            ? '삭제·처리 중…'
            : `${confirmLabel} 중…`
        }
        isPending={updatingId != null}
        onClose={() => {
          if (!updatingId) setConfirm(null);
        }}
        onConfirm={() => void confirmUpdate()}
      />
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-[11px] font-semibold tracking-wide text-[color:var(--color-lp-muted)] uppercase sm:w-8 sm:normal-case sm:tracking-normal">
        {label}
      </span>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`shrink-0 ${
              value === optionValue
                ? adminFilterActiveClassName
                : adminFilterIdleClassName
            }`}>
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportCard({
  row,
  busy,
  onResolve,
  onDismiss,
}: {
  row: ApiAdminReport;
  busy: boolean;
  onResolve: (opts?: {
    deleteMessage?: boolean;
    deleteComment?: boolean;
  }) => void;
  onDismiss: () => void;
}) {
  const href = targetHref(row);
  const author = targetAuthorNickname(row);
  const canDeleteMessage =
    row.status === 'pending' &&
    row.targetType === 'room_message' &&
    row.target?.kind === 'room_message' &&
    !row.targetMissing &&
    !row.target.deletedAt;
  const canDeleteComment =
    row.status === 'pending' &&
    row.targetType === 'comment' &&
    row.target?.kind === 'comment' &&
    !row.targetMissing;
  const canDeleteThenResolve = canDeleteMessage || canDeleteComment;

  return (
    <article className={`${adminPanelClassName} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-primary">
          {TARGET_LABEL[row.targetType]}
        </span>
        <span className="text-[11px] text-[color:var(--color-lp-muted)]">
          {STATUS_LABEL[row.status]}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-[color:var(--color-lp-muted)]">
          {formatDate(row.createdAt)}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-medium text-[color:var(--color-lp-muted)]">
          신고 사유
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[color:var(--color-lp-cream)]">
          {row.reason}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-[rgb(201_166_107/0.14)] bg-[rgb(20_16_12/0.45)] px-3 py-2.5">
        <p className="text-[11px] font-medium text-[color:var(--color-lp-muted)]">
          원문
        </p>
        <TargetPreview row={row} />
      </div>

      <p className="mt-3 text-[12px] text-[color:var(--color-lp-muted)]">
        <span className="text-[color:var(--color-lp-cream)]">
          @{row.reporter.nickname}
        </span>
        <span className="mx-1.5 opacity-60">→</span>
        <span className="text-[color:var(--color-lp-cream)]">
          @{author ?? '—'}
        </span>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {href ? (
          <Link
            href={href}
            className="text-xs font-medium text-brand-primary hover:text-brand-primary/80">
            원문 보기
          </Link>
        ) : (
          <span />
        )}
        {row.status === 'pending' ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onResolve(
                  canDeleteThenResolve
                    ? {
                        deleteMessage: canDeleteMessage || undefined,
                        deleteComment: canDeleteComment || undefined,
                      }
                    : undefined,
                )
              }
              className="min-h-10 flex-1 cursor-pointer rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-[color:var(--color-lp-ink)] transition-colors hover:bg-brand-primary/90 disabled:opacity-50 sm:flex-none">
              {canDeleteThenResolve ? '삭제 후 처리' : '처리'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onDismiss}
              className={`${adminOutlineBtnClassName} min-h-10 flex-1 sm:flex-none`}>
              기각
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function targetHref(row: ApiAdminReport): string | null {
  const t = row.target;
  if (!t) return null;
  if (t.kind === 'recommendation') {
    return `/admin/recommendations?id=${row.targetId}`;
  }
  if (t.kind === 'comment') {
    return `/admin/recommendations?id=${t.recommendationId}&commentId=${row.targetId}`;
  }
  return `/admin/rooms?id=${t.roomId}&messageId=${row.targetId}`;
}

function TargetPreview({ row }: { row: ApiAdminReport }) {
  const t = row.target;
  if (!t || row.targetMissing) {
    return (
      <p className={`mt-1 ${adminMutedClassName}`}>
        삭제되었거나 찾을 수 없습니다.
      </p>
    );
  }
  return (
    <div className="mt-1 space-y-1">
      <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-[color:var(--color-lp-cream)]">
        {previewText(t)}
      </p>
      {t.kind === 'recommendation' && t.hidden ? (
        <p className="text-[11px] text-[color:var(--color-lp-muted)]">숨김</p>
      ) : null}
      {t.kind === 'comment' && t.recommendationTitle ? (
        <p className="text-[11px] text-[color:var(--color-lp-muted)]">
          글 · {t.recommendationTitle}
        </p>
      ) : null}
      {t.kind === 'room_message' ? (
        <p className="text-[11px] text-[color:var(--color-lp-muted)]">
          {t.roomName ?? '방'}
          {t.deletedAt ? ' · 삭제됨' : ''}
        </p>
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
  return t.body?.trim() ? t.body : '(본문 없음 · 삭제된 메시지일 수 있음)';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
