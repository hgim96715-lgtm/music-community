'use client';

import { deleteSavedCard, patchSavedCard } from '@/lib/api';
import type { ApiSavedCard, ApiSavedCardCustomization } from '@/lib/apiTypes';
import { prepareSavedCardCustomization } from '@/lib/savedCardDefaults';
import { brandPillBtn, dialogBack, dialogPanel } from '@/lib/neobrutal';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { LpAlbumJacket } from './LpAlbumJacket';
import { SavedCardCustomizationForm } from './SavedCardCustomizationForm';

type SavedCardAlbumModalProps = {
  card: ApiSavedCard | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (savedCardId: string) => void;
  onUpdated: (card: ApiSavedCard) => void;
};

function asJacketCustomization(
  customization: ApiSavedCardCustomization,
): ApiSavedCardCustomization {
  return {
    ...customization,
    layout: 'lp-jacket',
  };
}

export function SavedCardAlbumModal({
  card,
  open,
  onClose,
  onDeleted,
  onUpdated,
}: SavedCardAlbumModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [customization, setCustomization] =
    useState<ApiSavedCardCustomization | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [decorTool, setDecorTool] = useState<'select' | 'pen'>('select');
  const [penColor, setPenColor] = useState('#2c2418');
  const [penWidth, setPenWidth] = useState(2.5);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !card) return;
    setMode('view');
    setDecorTool('select');
    setCustomization(
      asJacketCustomization(structuredClone(card.customization)),
    );
  }, [open, card]);

  if (!open || !mounted || !card || !customization) return null;

  const updateCustomization: Dispatch<
    SetStateAction<ApiSavedCardCustomization>
  > = (value) => {
    setCustomization((prev) => {
      const base = prev ?? card.customization;
      const next = typeof value === 'function' ? value(base) : value;
      return asJacketCustomization(next);
    });
  };

  async function handleSaveEdit() {
    setSaving(true);
    setError('');
    try {
      if (!card) return;
      const updated = await patchSavedCard(
        card.id,
        prepareSavedCardCustomization(asJacketCustomization(customization!)),
      );
      onUpdated(updated);
      setMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      if (!card) return;
      await deleteSavedCard(card.id);
      onDeleted(card.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했어요.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-card-album-title"
        onClick={onClose}>
        <div
          className="relative w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}>
          <div className={dialogBack} aria-hidden />
          <div
            className={`${dialogPanel} flex max-h-[92vh] flex-col overflow-hidden`}>
            <div className="shrink-0 border-b border-neutral-100 px-6 pb-4 pt-6 text-center">
              <h2
                id="saved-card-album-title"
                className="text-lg font-semibold text-brand-primary">
                {mode === 'view' ? '내 자켓' : '자켓 수정'}
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col items-center px-1">
                <LpAlbumJacket
                  size="lg"
                  title={card.recommendation.title}
                  artist={card.recommendation.artist}
                  embedUrl={card.recommendation.embedUrl}
                  reason={card.recommendation.reason}
                  moods={card.recommendation.moods}
                  postedAt={card.recommendation.createdAt}
                  savedAt={card.createdAt}
                  customization={customization}
                  decorTool={mode === 'edit' ? decorTool : 'select'}
                  penColor={penColor}
                  penWidth={penWidth}
                  onCustomizationChange={
                    mode === 'edit' ? updateCustomization : undefined
                  }
                  className="shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                />
              </div>
              {mode === 'edit' ? (
                <div className="mt-5">
                  <SavedCardCustomizationForm
                    customization={customization}
                    setCustomization={updateCustomization}
                    onError={setError}
                    decorTool={decorTool}
                    onDecorToolChange={setDecorTool}
                    penColor={penColor}
                    onPenColorChange={setPenColor}
                    penWidth={penWidth}
                    onPenWidthChange={setPenWidth}
                  />
                </div>
              ) : null}
              {error ? (
                <p className="mt-4 text-center text-sm text-red-600">{error}</p>
              ) : null}
            </div>

            <div className="shrink-0 flex flex-col gap-2 border-t border-neutral-100 px-6 py-4">
              {mode === 'view' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className={`${brandPillBtn} justify-center`}>
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-full py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    앨범에서 삭제
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full py-2 text-sm text-neutral-500 hover:text-brand-primary">
                    닫기
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className={`${brandPillBtn} justify-center disabled:opacity-50`}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      '저장'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomization(
                        asJacketCustomization(
                          structuredClone(card.customization),
                        ),
                      );
                      setMode('view');
                    }}
                    disabled={saving}
                    className="rounded-full py-2 text-sm text-neutral-500 hover:text-brand-primary">
                    취소
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <FeedDialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={handleDelete}
        isPending={deleting}
        title="앨범에서 삭제할까요?"
        description="자켓만 지워지고 피드 글은 남아요."
        confirmLabel="삭제"
      />
    </>,
    document.body,
  );
}
