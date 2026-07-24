'use client';

import { brandPillBtn, dialogPanel } from '@/lib/neobrutal';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type FeedDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  /** 확인 버튼 문구 */
  confirmLabel?: string;
  /** @deprecated 오타 — `confirmLabel` 사용 */
  comfirmLabel?: string;
  /** pending 중 확인 버튼 문구 */
  pendingLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
};

export function FeedDialog({
  open,
  onClose,
  title = '삭제하시겠습니까?',
  description = '삭제하면 되돌릴 수 없어요.',
  confirmLabel,
  pendingLabel,
  cancelLabel = '취소',
  isPending = false,
  onConfirm,
}: FeedDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const actionLabel = confirmLabel ?? confirmLabel ?? '삭제';
  const actionPendingLabel = pendingLabel ?? `${actionLabel} 중…`;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isPending, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-dialog-title"
      onClick={() => {
        if (!isPending) onClose();
      }}>
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}>
        <div className={`${dialogPanel} p-6`}>
          <h2
            id="feed-dialog-title"
            className="text-center text-lg font-semibold text-brand-primary">
            {title}
          </h2>
          <p className="mt-2 whitespace-pre-line text-center text-sm leading-relaxed text-[#a89880]">
            {description}
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`${brandPillBtn} justify-center disabled:opacity-50`}>
              {isPending ? actionPendingLabel : actionLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full py-2 text-sm font-medium text-[#a89880] transition-colors hover:text-brand-primary disabled:opacity-50">
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
