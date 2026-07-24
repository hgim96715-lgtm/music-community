'use client';

import { LpAlbumJacket } from '@/components/saved-cards/LpAlbumJacket';
import type { ApiSavedCardCustomization } from '@/lib/apiTypes';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** 채팅·앨범 등 — 꾸민 자켓 확대 보기 (재생 ❌) */
export type JacketPreviewSource = {
  createdAt: string;
  customization: ApiSavedCardCustomization;
  recommendation: {
    title: string;
    artist: string;
    embedUrl: string;
    reason: string;
    moods: string[];
    createdAt: string;
  };
};

type JacketPreviewModalProps = {
  jacket: JacketPreviewSource | null;
  onClose: () => void;
};

export function JacketPreviewModal({ jacket, onClose }: JacketPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!jacket) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jacket, onClose]);

  if (!jacket || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="자켓 미리보기"
      onClick={onClose}>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex size-9 items-center justify-center rounded-full border-2 border-[rgb(201_166_107/0.45)] bg-[rgb(28_24_20)] text-[#ebe4da] shadow-[2px_2px_0_rgb(0_0_0/0.35)] transition-colors hover:border-brand-primary hover:text-brand-primary">
          <X className="size-4" strokeWidth={2.5} aria-hidden />
        </button>
                    <div className="rounded-2xl border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.94)] p-3 shadow-[0_16px_48px_rgba(0,0,0,0.42)]">
          <LpAlbumJacket
            size="lg"
            title={jacket.recommendation.title}
            artist={jacket.recommendation.artist}
            embedUrl={jacket.recommendation.embedUrl}
            reason={jacket.recommendation.reason}
            moods={jacket.recommendation.moods}
            postedAt={jacket.recommendation.createdAt}
            savedAt={jacket.createdAt}
            customization={jacket.customization}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
