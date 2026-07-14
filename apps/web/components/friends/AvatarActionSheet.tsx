'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { User } from 'lucide-react';

type AvatarActionSheetProps = {
  open: boolean;
  onClose: () => void;
  nickname: string;
  /** 관계 한 줄 — 예: 친구 · 요청 보냄 */
  relationLabel: string;
  children: React.ReactNode;
};

export function AvatarActionSheet({
  open,
  onClose,
  nickname,
  relationLabel,
  children,
}: AvatarActionSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-action-sheet-title"
      onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl border-2 border-brand-border bg-white shadow-[4px_4px_0_var(--color-brand-shadow-soft)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-2 border-b border-neutral-100 px-5 pb-4 pt-5">
          <div
            className="flex size-12 items-center justify-center rounded-full border-2 border-brand-border bg-brand-primary-soft text-brand-primary"
            aria-hidden>
            <User className="size-6" />
          </div>
          <h2
            id="avatar-action-sheet-title"
            className="text-base font-semibold text-brand-primary">
            @{nickname}
          </h2>
          <p className="text-xs text-neutral-500">{relationLabel}</p>
        </div>
        <div className="flex flex-col gap-1 p-3">{children}</div>
        <div className="border-t border-neutral-100 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-primary">
            취소
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 시트 안 액션 행 */
export function AvatarActionRow({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-neutral-800 hover:bg-brand-primary-soft hover:text-brand-primary'
      }`}>
      {label}
      {disabled ? (
        <span className="ml-2 text-xs font-medium text-neutral-400">
          준비중
        </span>
      ) : null}
    </button>
  );
}
