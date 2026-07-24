'use client';
import { fetchRecommendations } from '@/lib/api';
import type { Recommendation } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RoomSongCard } from './RoomSongCard';

type RoomSongShareSheetProps = {
  open: boolean;
  userId: string;
  sending: boolean;
  onClose: () => void;
  onPick: (recommendationId: string) => void;
};

/** composer + → 곡 공유 — 내 추천 글 고르기  */
export function RoomSongShareSheet({
  open,
  userId,
  sending,
  onClose,
  onPick,
}: RoomSongShareSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mine, setMine] = useState<Recommendation[]>([]);
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
    fetchRecommendations(userId)
      .then((list) => {
        if (cancelled) return;
        setMine(list.filter((r) => r.author.id === userId));
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : '목록을 불러오지 못했어요',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="곡 공유"
      onClick={() => {
        // 메뉴에서 연 직후 고스트 클릭으로 바로 닫히지 않게
        if (Date.now() - openedAtRef.current < 300) return;
        onClose();
      }}>
      <div
        className="room-sheet flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[14px] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[rgb(201_166_107/0.18)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#ebe3d8]">곡 공유</h2>
          <p className="mt-0.5 text-[12px] text-[#a89880]">
            내가 올린 추천 중에서 고르세요
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <Loader2 className="mx-auto my-8 size-5 animate-spin text-brand-primary" />
          ) : error ? (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          ) : mine.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#a89880]">
              공유할 내 추천 글이 없어요
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {mine.map((r) => (
                <li key={r.id}>
                  <RoomSongCard
                    song={{
                      title: r.title,
                      artist: r.artist,
                      embedUrl: r.embedUrl,
                    }}
                    onPlay={() => {
                      if (!sending) onPick(r.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border-t border-[rgb(201_166_107/0.18)] py-3.5 text-[15px] font-semibold text-brand-primary">
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}
