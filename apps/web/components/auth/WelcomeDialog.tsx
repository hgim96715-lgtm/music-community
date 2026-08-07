'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type WelcomeDialogProps = {
  open: boolean;
  onClose: () => void;
  nickname: string;
  onContinue: () => void;
};

/** 로그인 직후 — LP Bar 입장권 모달 */
export function WelcomeDialog({
  open,
  onClose,
  nickname,
  onContinue,
}: WelcomeDialogProps) {
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

  if (!open || !mounted || !nickname.trim()) return null;

  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dialog-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-[20rem]"
        onClick={(e) => e.stopPropagation()}>
        {/* 입장권 */}
        <div className="-rotate-[2deg] shadow-[4px_4px_0_var(--color-brand-shadow-soft)]">
          <div className="overflow-hidden rounded-[4px] border-2 border-[color:var(--color-brand-border)] bg-[color:var(--color-lp-paper)] text-[color:var(--color-lp-ink)]">
            {/* 헤더 스트립 */}
            <div className="flex items-center justify-between border-b-2 border-[color:var(--color-brand-border)] bg-brand-primary px-4 py-2">
              <span
                className="text-[11px] font-bold tracking-[0.2em]"
                style={{ fontFamily: 'var(--font-napkin-hand, cursive)' }}>
                LP BAR
              </span>
              <span className="text-[10px] font-semibold tracking-wider opacity-80">
                ADMIT ONE
              </span>
            </div>

            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] tracking-[0.18em] text-[color:var(--color-lp-ink-soft)] uppercase">
                Guest
              </p>
              <h2
                id="welcome-dialog-title"
                className="mt-1 text-xl font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-napkin-hand, cursive)' }}>
                @{nickname}
              </h2>
              <p className="mt-2 text-[12px] leading-snug text-[color:var(--color-lp-ink-soft)]">
                오늘 한 곡, 안으로 들어와요.
              </p>
            </div>

            {/* 절취선 */}
            <div
              className="relative mx-3 border-t-2 border-dashed border-[rgb(31_26_22/0.28)]"
              aria-hidden>
              <span className="absolute -top-1.5 -left-4 size-3 rounded-full bg-[rgb(20_16_12)]" />
              <span className="absolute -top-1.5 -right-4 size-3 rounded-full bg-[rgb(20_16_12)]" />
            </div>

            {/* 스텁 */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[9px] tracking-[0.16em] text-[color:var(--color-lp-ink-soft)] uppercase">
                  Date
                </p>
                <p className="text-[12px] font-medium">{dateLabel}</p>
              </div>
              <span
                className="-rotate-[8deg] rounded-[2px] border-2 border-[rgb(160_55_45/0.85)] px-2 py-1 text-[11px] font-bold tracking-wider text-[rgb(160_55_45)]"
                style={{ fontFamily: 'var(--font-napkin-hand, cursive)' }}>
                입장
              </span>
            </div>

            <div className="border-t-2 border-[color:var(--color-brand-border)] px-4 py-3">
              <button
                type="button"
                onClick={onContinue}
                className="flex w-full items-center justify-center rounded-full bg-[color:var(--color-lp-ink)] py-2.5 text-sm font-semibold text-[color:var(--color-lp-paper)] transition-opacity hover:opacity-90">
                입장하기
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-1.5 text-center text-[12px] font-medium text-[color:var(--color-lp-ink-soft)] transition-colors hover:text-[color:var(--color-lp-ink)]">
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
