'use client';

import { napkinHandClassName } from '@/lib/napkinFont';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type FriendRequestPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  firstNickname: string;
  count: number;
};

/** 친구 요청 — LP Bar 테이블 위 냅킨 쪽지 */
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

  const line =
    count === 1
      ? `@${firstNickname}\n친구하고 싶대요.`
      : `@${firstNickname} 외 ${count - 1}명\n친구하고 싶대요.`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-request-prompt-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-[17.5rem]"
        onClick={(e) => e.stopPropagation()}>
        {/* 냅킨 — 살짝 기울어 테이블에 놓인 느낌 */}
        <div className="relative rotate-[2.5deg] shadow-[3px_4px_0_var(--color-brand-shadow-soft)]">
          <div
            className="relative overflow-hidden rounded-[2px] border border-[rgb(31_26_22/0.14)] bg-[#f7f1e8] px-5 pt-5 pb-4 text-[color:var(--color-lp-ink)]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -2deg,
                transparent,
                transparent 11px,
                rgb(31 26 22 / 0.035) 11px,
                rgb(31 26 22 / 0.035) 12px
              )`,
            }}>
            {/* 접힌 모서리 */}
            <span
              aria-hidden
              className="absolute top-0 right-0 size-7 bg-[linear-gradient(225deg,#ebe3d8_50%,transparent_50%)] opacity-90"
            />
            <span
              aria-hidden
              className="absolute top-0 right-0 size-7 border-b border-l border-[rgb(31_26_22/0.1)]"
              style={{
                clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
              }}
            />

            <p
              className={`${napkinHandClassName} text-center text-[13px] tracking-wide text-[color:var(--color-lp-ink-soft)]`}>
              테이블 위 쪽지
            </p>
            <h2
              id="friend-request-prompt-title"
              className={`${napkinHandClassName} mt-3 whitespace-pre-line text-center text-[1.35rem] leading-snug`}>
              {line}
            </h2>
            <p
              className={`${napkinHandClassName} mt-3 text-center text-[12px] text-[color:var(--color-lp-ink-soft)]`}>
              — 펼쳐볼래요?
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/friends/requests"
                onClick={onClose}
                className={`${napkinHandClassName} flex items-center justify-center rounded-full border-2 border-[color:var(--color-brand-border)] bg-brand-primary py-2.5 text-[1.05rem] text-[color:var(--color-lp-ink)] shadow-[2px_2px_0_var(--color-brand-shadow-soft)] transition-transform hover:-translate-y-0.5`}>
                쪽지 펼치기
              </Link>
              <button
                type="button"
                onClick={onClose}
                className={`${napkinHandClassName} py-1.5 text-center text-[13px] text-[color:var(--color-lp-ink-soft)] transition-colors hover:text-[color:var(--color-lp-ink)]`}>
                주머니에 넣기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
