'use client';

import { brandPillBtn, dialogBack, dialogPanel } from '@/lib/neobrutal';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type FeedDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  comfirmLabel?: string;
  isPending?: boolean;
};

export function FeedDialog({
  open,
  onClose,
  title = '삭제하시겠습니까?',
  description = '삭제하면 되돌릴 수 없어요.',
  comfirmLabel = '삭제',
  isPending = false,
  onConfirm,
}: FeedDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-dialog-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}>
        <div className={dialogBack} aria-hidden />
        <div className={`${dialogPanel} p-6`}>
          <h2
            id="feed-dialog-title"
            className="text-center text-lg font-semibold text-brand-primary">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`${brandPillBtn} disabled:opacity-50 justify-center`}>
              {isPending ? '삭제 중…' : comfirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary disabled:opacity-50">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
