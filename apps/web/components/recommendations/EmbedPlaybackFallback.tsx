'use client';
import { ChevronUp } from 'lucide-react';
import { brandPillBtn, embedPlayerFooter, embedPlayerShell } from '@/lib/neobrutal';

type EmbedPlaybackFallbackProps = {
  thumbnailUrl: string;
  message: string;
  externalHref: string;
  externalLabel: string;
  onClose: () => void;
};

export function EmbedPlaybackFallback({
  thumbnailUrl,
  message,
  externalHref,
  externalLabel,
  onClose,
}: EmbedPlaybackFallbackProps) {
  return (
    <div className={embedPlayerShell}>
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-white/60 px-4 py-6">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-20 w-32 rounded-lg object-cover ring-1 ring-black/[0.05]"
          />
        ) : null}
        <p className="text-center font-sans text-xs leading-relaxed text-neutral-500">
          {message}
        </p>
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${brandPillBtn} px-4 py-2 text-sm`}>
          {externalLabel}
        </a>
      </div>
      <button type="button" onClick={onClose} className={embedPlayerFooter}>
        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        접기
      </button>
    </div>
  );
}
