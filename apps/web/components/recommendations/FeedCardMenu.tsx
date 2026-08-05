'use client';

import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { deleteRecommendation } from '@/lib/api';
import { FeedDialog } from './FeedDialog';
import { canEditRecommendationToday } from '@/lib/date';
import Link from 'next/link';
import { LoginPromptDialog } from '../auth/LoginPromptDialog';
import { pillTextareaClassName } from '@/lib/form';
import { createRecommendationReport } from '@/lib/reports';

type FeedCardMenuProps = {
  recommendationId: string;
  createdAt: string;
  variant?: 'default' | 'neo';
  authorId: string;
  onDeleted?: (id: string) => void;
};
export function FeedCardMenu({
  recommendationId,
  createdAt,
  variant = 'default',
  onDeleted,
  authorId,
}: FeedCardMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const isOwn = Boolean(user?.id && authorId && user.id === authorId);
  const canEdit = isOwn && canEditRecommendationToday(createdAt);

  function openConfirm() {
    if (!isOwn || isDeleting) return;
    setOpen(false);
    setConfirmOpen(true);
  }

  function openReport() {
    setOpen(false);
    if (!user) {
      // 트리거 클릭이 로그인 모달 배경에 닫힘으로 전달되지 않게 한 틱 뒤 오픈
      window.setTimeout(() => setLoginOpen(true), 0);
      return;
    }
    if (isOwn) return;
    setReason('');
    setReasonError('');
    window.setTimeout(() => setReportOpen(true), 0);
  }

  async function confirmDelete() {
    if (!isOwn) return;
    setIsDeleting(true);
    try {
      await deleteRecommendation(recommendationId);
      onDeleted?.(recommendationId);
      setConfirmOpen(false);
    } catch {
      console.error('추천 삭제 실패');
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmReport() {
    if (isReporting || isOwn) return;
    const trimmed = reason.trim();
    if (trimmed.length < 2) {
      setReasonError('최소 2자 이상 입력해 주세요.');
      return;
    }
    setIsReporting(true);
    setReasonError('');
    try {
      await createRecommendationReport(recommendationId, trimmed);
      setReported(true);
      setReportOpen(false);
      setReason('');
    } catch (error) {
      setReasonError(
        error instanceof Error ? error.message : '신고에 실패했어요.',
      );
    } finally {
      setIsReporting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="더보기"
        aria-expanded={open}
        className={
          variant === 'neo'
            ? '-mr-1 rounded-md p-1 text-[#a89880] transition-colors hover:bg-white/[0.06] hover:text-[#ebe4da]'
            : '-mr-1 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100/80 hover:text-neutral-700'
        }>
        <Ellipsis
          className="h-[1.125rem] w-[1.125rem] shrink-0"
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 min-w-[9rem] overflow-hidden rounded-xl border border-neutral-200/80 bg-white/95 py-1 text-sm shadow-lg backdrop-blur-md">
          <button
            type="button"
            role="menuitem"
            disabled
            className="block w-full px-3 py-2 text-left text-neutral-400">
            링크 복사 (준비 중)
          </button>
          {!isOwn ? (
            <button
              type="button"
              role="menuitem"
              disabled={reported}
              onClick={openReport}
              className={
                reported
                  ? 'block w-full px-3 py-2 text-left text-neutral-400'
                  : 'block w-full px-3 py-2 text-left text-neutral-700 hover:bg-neutral-50'
              }>
              {reported ? '신고 완료' : '신고'}
            </button>
          ) : null}
          {canEdit ? (
            <Link
              href={`/recommendations/${recommendationId}/edit`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block w-full px-3 py-2 text-left text-brand-primary hover:bg-neutral-50">
              수정
            </Link>
          ) : null}
          {isOwn ? (
            <button
              type="button"
              role="menuitem"
              disabled={isDeleting}
              onClick={openConfirm}
              className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">
              삭제
            </button>
          ) : null}
        </div>
      ) : null}

      <FeedDialog
        open={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        onConfirm={confirmDelete}
        isPending={isDeleting}
      />
      <FeedDialog
        open={reportOpen}
        title="이 글을 신고할까요?"
        description="운영 검토용이에요. 허위 신고는 제재될 수 있어요."
        confirmLabel="신고"
        pendingLabel="신고 중…"
        isPending={isReporting}
        onClose={() => {
          if (!isReporting) {
            setReportOpen(false);
            setReason('');
            setReasonError('');
          }
        }}
        onConfirm={() => void confirmReport()}>
        <div className="space-y-1.5">
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError('');
            }}
            placeholder="신고 사유 (필수)"
            rows={3}
            maxLength={500}
            disabled={isReporting}
            className={`${pillTextareaClassName} text-left`}
          />
          {reasonError ? (
            <p className="px-1 text-left text-xs text-red-500" role="alert">
              {reasonError}
            </p>
          ) : null}
        </div>
      </FeedDialog>
      <LoginPromptDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        redirectPath="/recommendations"
        title="로그인이 필요해요"
        description="신고하려면 로그인해 주세요."
      />
    </div>
  );
}
