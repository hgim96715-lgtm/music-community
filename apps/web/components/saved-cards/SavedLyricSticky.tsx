'use client';

import type { ApiSavedLyric } from '@/lib/apiTypes';
import { formatDisplayDate, formatFeedDate } from '@/lib/date';
import { Loader2, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

type SavedLyricStickyProps = {
  item: ApiSavedLyric;
  /** 살짝 기울기 변화용 */
  tiltIndex?: number;
  onPlay: () => void;
  onDelete: () => void;
  onPatch: (body: {
    lyricsText?: string;
    note?: string | null;
  }) => Promise<void>;
};

const PAPER_TINT = [
  'rgb(46 40 34 / 100%)',
  'rgb(42 36 30 / 100%)',
  'rgb(44 38 32 / 100%)',
  'rgb(40 34 28 / 100%)',
] as const;

/**
 * 가사 모음 — 잉크 쪽지 · 앞=소절 / 뒤=메모
 * LP Bar: 크림 포스트잇 ❌ · ink + brass
 */
export function SavedLyricSticky({
  item,
  tiltIndex = 0,
  onPlay,
  onDelete,
  onPatch,
}: SavedLyricStickyProps) {
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState<'lyrics' | 'note' | null>(null);
  const [lyricsDraft, setLyricsDraft] = useState(item.lyricsText);
  const [noteDraft, setNoteDraft] = useState(item.note ?? '');
  const [saving, setSaving] = useState(false);
  const paper = PAPER_TINT[tiltIndex % PAPER_TINT.length];
  const rotate = ((tiltIndex % 5) - 2) * 1.1;
  const hasNote = Boolean(item.note?.trim());
  const savedShort = formatDisplayDate(item.createdAt);
  const savedLabel = formatFeedDate(item.createdAt);
  const isEditing = editing !== null;

  useEffect(() => {
    if (editing !== 'lyrics') setLyricsDraft(item.lyricsText);
  }, [item.lyricsText, editing]);

  useEffect(() => {
    if (editing !== 'note') setNoteDraft(item.note ?? '');
  }, [item.note, editing]);

  async function handleSaveLyrics() {
    const next = lyricsDraft.trim();
    if (!next) {
      alert('가사를 입력해 주세요');
      return;
    }
    if (next === item.lyricsText.trim()) {
      setEditing(null);
      return;
    }
    setSaving(true);
    try {
      await onPatch({ lyricsText: next });
      setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '가사 저장에 실패했어요');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote() {
    const next = noteDraft.trim() || null;
    const prev = item.note?.trim() || null;
    if (next === prev) {
      setEditing(null);
      return;
    }
    setSaving(true);
    try {
      await onPatch({ note: next });
      setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '메모 저장에 실패했어요');
    } finally {
      setSaving(false);
    }
  }

  function startEditLyrics() {
    setLyricsDraft(item.lyricsText);
    setEditing('lyrics');
    setFlipped(false);
  }

  function startEditNote() {
    setNoteDraft(item.note ?? '');
    setEditing('note');
    setFlipped(true);
  }

  return (
    <div
      className="lyric-sticky"
      style={{ ['--lyric-sticky-rot' as string]: `${rotate}deg` }}>
      <div
        className={`lyric-sticky-inner${flipped ? ' is-flipped' : ''}${isEditing ? ' is-editing' : ''}`}>
        {/* 앞 — 가사 */}
        <div
          className="lyric-sticky-face lyric-sticky-front"
          style={{ backgroundColor: paper }}>
          {editing === 'lyrics' ? (
            <div className="lyric-sticky-back-main">
              <span className="lyric-sticky-back-label">가사 수정</span>
              <textarea
                className="lyric-sticky-note-input is-lyrics"
                value={lyricsDraft}
                onChange={(e) => setLyricsDraft(e.target.value)}
                placeholder="꽂힌 소절을 적어 두세요"
                rows={4}
                maxLength={1000}
                disabled={saving}
                autoFocus
              />
              <div className="lyric-sticky-actions">
                <button
                  type="button"
                  className="lyric-sticky-action"
                  disabled={saving}
                  onClick={() => {
                    setLyricsDraft(item.lyricsText);
                    setEditing(null);
                  }}>
                  취소
                </button>
                <button
                  type="button"
                  className="lyric-sticky-action is-primary"
                  disabled={saving}
                  onClick={() => void handleSaveLyrics()}>
                  {saving ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : null}
                  저장
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="lyric-sticky-back-main"
                onClick={() => setFlipped(true)}
                aria-label={`${item.recommendation.title} 가사 · ${savedLabel} · 뒤집어 메모 보기`}>
                <span className="lyric-sticky-track">
                  {item.recommendation.title}
                  <span aria-hidden> · </span>
                  {item.recommendation.artist}
                </span>
                <time
                  className="lyric-sticky-date"
                  dateTime={item.createdAt}
                  title={savedLabel}>
                  {savedShort}
                </time>
                <span className="lyric-sticky-quote">
                  “{item.lyricsText.trim()}”
                </span>
                <span className="lyric-sticky-hint">
                  {hasNote ? '탭해서 메모 →' : '탭해서 뒤집기 →'}
                </span>
              </button>
              <div className="lyric-sticky-actions">
                <button
                  type="button"
                  className="lyric-sticky-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditLyrics();
                  }}>
                  가사
                </button>
                <button
                  type="button"
                  className="lyric-sticky-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(true);
                  }}>
                  메모면
                </button>
              </div>
            </>
          )}
        </div>

        {/* 뒤 — 메모 */}
        <div
          className="lyric-sticky-face lyric-sticky-back"
          style={{ backgroundColor: paper }}>
          {editing === 'note' ? (
            <div className="lyric-sticky-back-main">
              <span className="lyric-sticky-back-label">메모 수정</span>
              <textarea
                className="lyric-sticky-note-input"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="그때의 감정을 적어 두세요"
                rows={4}
                maxLength={500}
                disabled={saving}
                autoFocus
              />
              <div className="lyric-sticky-actions">
                <button
                  type="button"
                  className="lyric-sticky-action"
                  disabled={saving}
                  onClick={() => {
                    setNoteDraft(item.note ?? '');
                    setEditing(null);
                  }}>
                  취소
                </button>
                <button
                  type="button"
                  className="lyric-sticky-action is-primary"
                  disabled={saving}
                  onClick={() => void handleSaveNote()}>
                  {saving ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : null}
                  저장
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="lyric-sticky-back-main"
                onClick={() => setFlipped(false)}
                aria-label="가사 면으로 돌아가기">
                <span className="lyric-sticky-back-label">그때의 메모</span>
                <time
                  className="lyric-sticky-date is-back"
                  dateTime={item.createdAt}>
                  {savedLabel}에 남김
                </time>
                <span className="lyric-sticky-note">
                  {hasNote ? item.note!.trim() : '남겨 둔 메모가 없어요'}
                </span>
                <span className="lyric-sticky-hint inline-flex items-center gap-1">
                  <RotateCcw className="size-3" aria-hidden />
                  다시 앞면
                </span>
              </button>
              <div className="lyric-sticky-actions">
                <button
                  type="button"
                  className="lyric-sticky-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay();
                  }}>
                  <Play className="size-3 fill-current" aria-hidden />
                  재생
                </button>
                <button
                  type="button"
                  className="lyric-sticky-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditNote();
                  }}>
                  메모
                </button>
                <button
                  type="button"
                  className="lyric-sticky-action is-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}>
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
