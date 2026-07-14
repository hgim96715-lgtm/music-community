'use client';
import { brandPillBtn, dialogBack, dialogPanel } from '@/lib/neobrutal';
import { getWelcomeCopy, WelcomeCopy } from '@/lib/welcomeCopy';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type WelcomeDialogProps = {
  open: boolean;
  onClose: () => void;
  nickname: string;
  onContinue: () => void;
};

export function WelcomeDialog({
  open,
  onClose,
  nickname,
  onContinue,
}: WelcomeDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [copy, setCopy] = useState<WelcomeCopy | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCopy(null);
      return;
    }
    setCopy(getWelcomeCopy());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted || !nickname.trim() || !copy) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dialog-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}>
        <div className={dialogBack} aria-hidden />
        <div className={`${dialogPanel} p-6`}>
          <p className="text-center text-2xl" aria-hidden>
            👋
          </p>
          <h2
            id="welcome-dialog-title"
            className="mt-2 text-center text-lg font-semibold text-brand-primary">
            {nickname}님, 안녕하세요
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
            {copy.greeting}
            <br />
            {copy.wish}
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={onContinue}
              className={`${brandPillBtn} justify-center`}>
              피드 보러 가기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
