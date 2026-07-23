'use client';
import { RoomLyricCard } from '@/components/rooms/RoomLyricCard';
import { RoomSongCard } from '@/components/rooms/RoomSongCard';
import { fetchRecommendations } from '@/lib/api';
import type { ApiSavedLyricBody } from '@/lib/apiTypes';
import type { Recommendation } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  userId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: ApiSavedLyricBody) => void;
  /** 있으면 곡 고르기 스킵 → 바로 가사·메모 */
  preset?: SavedLyricPreset | null;
};

export type SavedLyricPreset = {
  recommendationId: string;
  title: string;
  artist: string;
  embedUrl: string;
  /** 재생 중이던 초 → 시작 칸 미리 채움 (선택) */
  startSec?: number;
};

/** 목록·preset 공통 — Recommendation 전체 불필요 */
type PickedTrack = {
  id: string;
  title: string;
  artist: string;
  embedUrl: string;
};

function parseTimeInput(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(\d+):([0-5]?\d)$/);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** 듣다 저장 — 곡 고름 → 가사 · 메모 · 구간 */
export function SavedLyricSaveSheet({
  open,
  userId,
  saving,
  onClose,
  onSubmit,
  preset = null,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mine, setMine] = useState<Recommendation[]>([]);
  const [picked, setPicked] = useState<PickedTrack | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [note, setNote] = useState('');
  const [startRaw, setStartRaw] = useState('');
  const [endRaw, setEndRaw] = useState('');
  const [formError, setFormError] = useState('');
  const openedAtRef = useRef(0);
  const lockedByPreset = Boolean(preset);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    openedAtRef.current = Date.now();
    setLyrics('');
    setNote('');
    setEndRaw('');
    setFormError('');
    setError('');

    if (preset) {
      setPicked({
        id: preset.recommendationId,
        title: preset.title,
        artist: preset.artist,
        embedUrl: preset.embedUrl,
      });
      setStartRaw(preset.startSec != null ? String(preset.startSec) : '');
      setMine([]);
      setLoading(false);
      return;
    }

    setPicked(null);
    setStartRaw('');
    let cancelled = false;
    setLoading(true);
    fetchRecommendations(userId)
      .then((list) => {
        if (!cancelled) setMine(list.filter((r) => r.author.id === userId));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : '목록을 불러오지 못했어요',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    userId,
    preset?.recommendationId,
    preset?.title,
    preset?.artist,
    preset?.embedUrl,
    preset?.startSec,
  ]);

  if (!open || !mounted) return null;

  const previewStart = parseTimeInput(startRaw);
  const previewEnd = parseTimeInput(endRaw);

  function handleSubmit() {
    if (!picked || saving) return;
    const lyricsText = lyrics.trim();
    if (!lyricsText) {
      setFormError('가사를 입력해주세요');
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
    const noteTrim = note.trim();
    onSubmit({
      recommendationId: picked.id,
      lyricsText,
      ...(noteTrim ? { note: noteTrim } : {}),
      ...(start !== undefined ? { startSec: start } : {}),
      ...(end !== undefined ? { endSec: end } : {}),
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="가사 저장"
      onClick={() => {
        if (Date.now() - openedAtRef.current < 300) return;
        onClose();
      }}>
      <div
        className="flex max-h-[78vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[14px] bg-[#f3ebe3] shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[rgb(31_26_22/0.1)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#1a1410]">
            {picked ? '가사 · 메모' : '가사 저장'}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6b5c4c]">
            {picked
              ? `${picked.title} · ${picked.artist}`
              : '곡을 고른 뒤 소절을 남겨 보세요'}
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
                저장할 내 추천 글이 없어요
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
                      onPlay={() =>
                        setPicked({
                          id: r.id,
                          title: r.title,
                          artist: r.artist,
                          embedUrl: r.embedUrl,
                        })
                      }
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
                  className="napkin-hand mt-1.5 w-full resize-none rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2.5 text-[1.15rem] leading-snug text-[#1a1410] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[rgb(138_112_72/0.35)]"
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-medium text-[#6b5c4c]">
                  그때의 메모 (선택)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="왜 와닿았는지, 그때의 감정…"
                  className="napkin-hand mt-1.5 w-full resize-none rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2.5 text-[1.15rem] leading-snug text-[#1a1410] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[rgb(138_112_72/0.35)]"
                />
              </label>
              <div className="flex gap-2">
                <label className="min-w-0 flex-1">
                  <span className="text-[12px] font-medium text-[#6b5c4c]">
                    시작
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
                    끝
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={endRaw}
                    onChange={(e) => setEndRaw(e.target.value)}
                    placeholder="1:10"
                    className="mt-1.5 w-full rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2 text-sm tabular-nums text-[#1a1410] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[rgb(138_112_72/0.35)]"
                  />
                </label>
              </div>
              {formError ? (
                <p className="text-[12px] text-red-600">{formError}</p>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex gap-2 border-t border-[rgb(31_26_22/0.1)] px-3 py-3">
          {picked && !lockedByPreset ? (
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="flex-1 rounded-xl border border-[rgb(31_26_22/0.14)] py-2.5 text-sm font-medium text-[#3d342c]">
              곡 다시
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[rgb(31_26_22/0.14)] py-2.5 text-sm font-medium text-[#3d342c]">
              닫기
            </button>
          )}
          {picked ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-[#3d342c] py-2.5 text-sm font-semibold text-[#f7f1e8] disabled:opacity-50">
              {saving ? '저장 중…' : '모음에 저장'}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
