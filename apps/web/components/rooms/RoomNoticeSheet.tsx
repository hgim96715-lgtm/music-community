'use client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type RoomNoticeSheetProps = {
  open: boolean;
  body: string | null;
  /** 그룹방 = 방장만 */
  canEdit?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave?: (text: string) => void | Promise<void>;
};

/** 헤더 📣 → 방 공지 모달 */
export function RoomNoticeSheet({
  open,
  body,
  canEdit = false,
  saving = false,
  onClose,
  onSave,
}: RoomNoticeSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setError('');
      return;
    }
    setDraft(body ?? '');
  }, [open, body]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, saving]);

  if (!open || !mounted) return null;
  const text = body?.trim() ?? '';

  async function handleSave() {
    if (!onSave || saving) return;
    setError('');
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '저장에 실패했어요');
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="방 공지"
      onClick={() => {
        if (!saving) onClose();
      }}>
      <div
        className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[14px] bg-[#f3ebe3] shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 border-b border-[rgb(31_26_22/0.1)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#1a1410]">방 공지</h2>
          {canEdit && !editing ? (
            <button
              type="button"
              onClick={() => {
                setDraft(body ?? '');
                setEditing(true);
                setError('');
              }}
              className="text-[13px] font-semibold text-[#6b5428]">
              수정
            </button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              rows={6}
              disabled={saving}
              placeholder="규칙 · 오늘 주제 · 주의사항을 적어 주세요"
              className="w-full resize-none rounded-xl border border-[rgb(31_26_22/0.12)] bg-[#f7f1e8] px-3 py-2.5 text-[14px] leading-relaxed text-[#1a1410] outline-none placeholder:text-[#9a8b7a] focus:ring-2 focus:ring-[#8a7048]/25 disabled:opacity-50"
            />
          ) : text ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#1a1410]">
              {text}
            </p>
          ) : (
            <p className="py-6 text-center text-sm text-[#6b5c4c]">
              아직 공지가 없어요
              {canEdit ? ' · 수정으로 적어 보세요' : ''}
            </p>
          )}
          {error ? (
            <p className="mt-2 text-center text-sm text-red-600">{error}</p>
          ) : null}
        </div>
        {editing ? (
          <div className="flex border-t border-[rgb(31_26_22/0.1)]">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError('');
                setDraft(body ?? '');
              }}
              className="flex-1 py-3.5 text-[15px] font-semibold text-[#6b5c4c] disabled:opacity-40">
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex flex-1 items-center justify-center gap-1.5 border-l border-[rgb(31_26_22/0.1)] py-3.5 text-[15px] font-semibold text-[#6b5428] disabled:opacity-40">
              {saving ? <Loader2 className="size-4 animate-spin" /> : '저장'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="border-t border-[rgb(31_26_22/0.1)] py-3.5 text-[15px] font-semibold text-[#6b5428]">
            닫기
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
