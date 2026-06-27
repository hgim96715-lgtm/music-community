'use client';

import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type FeedCardMenuProps = {
  recommendationId: string;
  variant?: 'default' | 'neo';
};
export function FeedCardMenu({
  recommendationId,
  variant = 'default',
}: FeedCardMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
            ? '-mr-1 rounded-md p-1 text-neutral-700 transition-colors hover:bg-black/[0.06]'
            : '-mr-1 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100/80 hover:text-neutral-700'
        }>
        <Ellipsis className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.75} aria-hidden />
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
          <button
            type="button"
            role="menuitem"
            disabled
            className="block w-full px-3 py-2 text-left text-neutral-400">
            신고 (준비 중)
          </button>
          <span className="sr-only">글 ID {recommendationId}</span>
        </div>
      ) : null}
    </div>
  );
}
