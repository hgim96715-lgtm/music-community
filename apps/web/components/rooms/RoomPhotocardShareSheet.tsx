'use client';
import { LpAlbumJacket } from '@/components/saved-cards/LpAlbumJacket';
import { fetchSavedCards } from '@/lib/api';
import type { ApiSavedCard } from '@/lib/apiTypes';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type RoomPhotocardShareSheetProps = {
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onPick: (savedCardId: string) => void;
};

/** composer + → 자켓 공유 — 내 SavedCard 고르기 */
export function RoomPhotocardShareSheet({
  open,
  sending,
  onClose,
  onPick,
}: RoomPhotocardShareSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState<ApiSavedCard[]>([]);
  const openedAtRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    openedAtRef.current = Date.now();
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchSavedCards()
      .then((list) => {
        if (!cancelled) setCards(list);
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '목록을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="자켓 공유"
      onClick={() => {
        if (Date.now() - openedAtRef.current < 300) return;
        onClose();
      }}>
      <div
        className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[14px] bg-[#f3ebe3] shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[rgb(31_26_22/0.1)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#1a1410]">자켓 공유</h2>
          <p className="mt-0.5 text-[12px] text-[#6b5c4c]">
            내가 저장한 앨범 중에서 고르세요
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <Loader2 className="mx-auto my-8 size-5 animate-spin text-[#8a7048]" />
          ) : error ? (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          ) : cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6b5c4c]">
              공유할 자켓이 없어요
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {cards.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      if (!sending) onPick(c.id);
                    }}
                    className="w-full rounded-md text-left transition-transform active:scale-[0.98] disabled:opacity-40">
                    <LpAlbumJacket
                      size="md"
                      title={c.recommendation.title}
                      artist={c.recommendation.artist}
                      embedUrl={c.recommendation.embedUrl}
                      reason={c.recommendation.reason}
                      moods={c.recommendation.moods}
                      postedAt={c.recommendation.createdAt}
                      savedAt={c.createdAt}
                      customization={c.customization}
                      className="mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border-t border-[rgb(31_26_22/0.1)] py-3.5 text-[15px] font-semibold text-[#6b5428]">
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}
