'use client';

import { brandPillBtn, dialogBack, dialogPanel } from '@/lib/neobrutal';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type FriendRequestPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  firstNickname: string;
  count: number;
};

export function FriendRequestPromptDialog({
  open,
  onClose,
  firstNickname,
  count,
}: FriendRequestPromptDialogProps) {
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

  if (!open || !mounted || count < 1) return null;

  const description =
    count === 1
      ? `@${firstNickname} 님이 친구하고 싶어 해요`
      : `@${firstNickname} 외 ${count - 1}명이 친구하고 싶어 해요`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-request-prompt-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}>
        <div className={dialogBack} aria-hidden />
        <div className={`${dialogPanel} p-6`}>
          <p className="text-center text-2xl" aria-hidden>
            💌
          </p>
          <h2
            id="friend-request-prompt-title"
            className="mt-2 text-center text-lg font-semibold text-brand-primary">
            친구 요청이 있어요
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2">
            <Link
              href="/friends/requests"
              onClick={onClose}
              className={`${brandPillBtn} justify-center`}>
              요청 보기
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary">
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
