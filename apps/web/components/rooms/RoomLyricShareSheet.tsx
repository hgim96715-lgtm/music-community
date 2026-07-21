'use client';
import { fetchRecommendations } from '@/lib/api';
import type { Recommendation } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RoomLyricCard } from './RoomLyricCard';
import { RoomSongCard } from './RoomSongCard';

export type RoomLyricSharePayload = {
  recommendationId: string;
  body: string;
  lyricStartSec?: number;
  lyricEndSec?: number;
};

type RoomLyricShareSheetProps = {
  open: boolean;
  userId: string;
  sending: boolean;
  onClose: () => void;
  onSubmit: (payload: RoomLyricSharePayload) => void;
};

/** mm:ss 또는 초 → number. 빈 칸은 undefined */
function parseTimeInput(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(\d+):([0-5]?\d)$/);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}
/** composer + → 가사 — 곡 고르기 → 가사·구간 */

export function RoomLyricShareSheet({
  open,
  userId,
  sending,
  onClose,
  onSubmit,
}: RoomLyricShareSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mine, setMine] = useState<Recommendation[]>([]);
  const [picked, setPicked] = useState<Recommendation | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [startRaw, setStartRaw] = useState('');
  const [endRaw, setEndRaw] = useState('');
  const [formError, setFormError] = useState('');
  const openedAtRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    openedAtRef.current = Date.now();
    setPicked(null);
    setLyrics('');
    setStartRaw('');
    setEndRaw('');
    setFormError('');
    setError('');
    let cancelled = false;
    setLoading(true);
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

  const previewStart = parseTimeInput(startRaw);
  const previewEnd = parseTimeInput(endRaw);

  function handleSubmit() {
    if (!picked || sending) return;
    const body = lyrics.trim();
    if (!body) {
      setFormError('가사를 입력해주세요.');
      return;
    }
    const start = parseTimeInput(startRaw);
    const end = parseTimeInput(endRaw);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      setFormError('구간은 초 또는 mm:ss 로 적어 주세요.');
      return;
    }
    if (start !== undefined && end !== undefined && end < start) {
      setFormError('끝 시각은 시작 이후여야 해요.');
      return;
    }
    setFormError('');
    onSubmit({
      recommendationId: picked.id,
      body,
      ...(start !== undefined ? { lyricStartSec: start } : {}),
      ...(end !== undefined ? { lyricEndSec: end } : {}),
    });
  }
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="가사 공유"
      onClick={() => {
        if (Date.now() - openedAtRef.current < 300) return;
        onClose();
      }}>
      <div
        className="flex max-h-[78vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[14px] bg-[#f3ebe3] shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[rgb(31_26_22/0.1)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#1a1410]">
            {picked ? '가사 적기' : '가사 공유'}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6b5c4c]">
            {picked
              ? `${picked.title} · ${picked.artist}`
              : '곡을 고른 뒤 가사를 붙여넣으세요'}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {!picked ? (
            loading ? (
              <Loader2 className="mx-auto my-8 size-5 animate-spin text-[#8a7048]" />
            ) : error ? (
              <p className="py-6 text-center text-sm text-red-600">{error}</p>
            ) : mine.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6b5c4c]">
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
                      onPlay={() => setPicked(r)}
                    />
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <RoomLyricCard
                size="compose"
                data={{
                  title: picked.title,
                  artist: picked.artist,
                  embedUrl: picked.embedUrl,
                  lyrics,
                  startSec: Number.isNaN(previewStart)
                    ? undefined
                    : previewStart,
                  endSec: Number.isNaN(previewEnd) ? undefined : previewEnd,
                }}
              />
              <label className="block">
                <span className="text-[12px] font-medium text-[#6b5c4c]">
                  가사
                </span>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={4}
                  placeholder="이 소절을 붙여넣으세요"
                  className="mt-1.5 w-full resize-none rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2.5 text-sm text-[#1a1410] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[rgb(138_112_72/0.35)]"
                />
              </label>
              <div className="flex gap-2">
                <label className="min-w-0 flex-1">
                  <span className="text-[12px] font-medium text-[#6b5c4c]">
                    시작 (선택)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={startRaw}
                    onChange={(e) => setStartRaw(e.target.value)}
                    placeholder="0:42"
                    className="mt-1.5 w-full rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2 text-sm tabular-nums text-[#1a1410] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[rgb(138_112_72/0.35)]"
                  />
                </label>
                <label className="min-w-0 flex-1">
                  <span className="text-[12px] font-medium text-[#6b5c4c]">
                    끝 (선택)
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={endRaw}
                    onChange={(e) => setEndRaw(e.target.value)}
                    placeholder="1:05"
                    className="mt-1.5 w-full rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2 text-sm tabular-nums text-[#1a1410] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[rgb(138_112_72/0.35)]"
                  />
                </label>
              </div>
              {formError ? (
                <p className="text-center text-sm text-red-600">{formError}</p>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex flex-col border-t border-[rgb(31_26_22/0.1)]">
          {picked ? (
            <>
              <button
                type="button"
                disabled={sending}
                onClick={handleSubmit}
                className="py-3.5 text-[15px] font-semibold text-[#6b5428] disabled:opacity-40">
                {sending ? '보내는 중…' : '보내기'}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  setPicked(null);
                  setFormError('');
                }}
                className="border-t border-[rgb(31_26_22/0.1)] py-3 text-[14px] font-medium text-[#8a8070]">
                곡 다시 고르기
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="border-t border-[rgb(31_26_22/0.1)] py-3.5 text-[15px] font-semibold text-[#6b5428] disabled:opacity-40">
            취소
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
