'use client';

import { createSavedCard } from '@/lib/api';
import type { ApiSavedCardCustomization } from '@/lib/apiTypes';
import {
  buildSavedCardCustomization,
  prepareSavedCardCustomization,
} from '@/lib/savedCardDefaults';
import { brandPillBtn, dialogPanel } from '@/lib/neobrutal';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LpAlbumJacket } from './LpAlbumJacket';
import { SavedCardCustomizationForm } from './SavedCardCustomizationForm';

type SavedCardEditorDialogProps = {
  open: boolean;
  onClose: () => void;
  recommendationId: string;
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: string[];
  postedAt: string;
  defaultBackground?: string;
  onSaved?: () => void;
};

export function SavedCardEditorDialog({
  open,
  onClose,
  recommendationId,
  title,
  artist,
  embedUrl,
  reason,
  moods,
  postedAt,
  defaultBackground,
  onSaved,
}: SavedCardEditorDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [customization, setCustomization] = useState<ApiSavedCardCustomization>(
    () => buildSavedCardCustomization(defaultBackground),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [decorTool, setDecorTool] = useState<'select' | 'pen'>('select');
  const [penColor, setPenColor] = useState('#2c2418');
  const [penWidth, setPenWidth] = useState(2.5);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCustomization(buildSavedCardCustomization(defaultBackground));
    setError('');
    setDecorTool('select');
  }, [open, defaultBackground]);

  if (!open || !mounted) return null;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await createSavedCard({
        recommendationId,
        customization: prepareSavedCardCustomization(customization),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했어요.';
      if (message.includes('이미 저장')) {
        onSaved?.();
        onClose();
        return;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-card-editor-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}>
        <div className={`${dialogPanel} flex max-h-[92vh] flex-col overflow-hidden`}>
          <div className="shrink-0 border-b border-neutral-100 px-6 pb-4 pt-6 text-center">
            <h2
              id="saved-card-editor-title"
              className="text-lg font-semibold text-brand-primary">
              자켓 꾸미기
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              앨범 표지 위에 꾸밀 내용을 골라 주세요
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center px-1">
                <p className="mb-3 text-sm font-medium text-neutral-500">
                  미리보기
                </p>
                <LpAlbumJacket
                  size="lg"
                  title={title}
                  artist={artist}
                  embedUrl={embedUrl}
                  reason={reason}
                  moods={moods}
                  postedAt={postedAt}
                  customization={customization}
                  decorTool={decorTool}
                  penColor={penColor}
                  penWidth={penWidth}
                  onCustomizationChange={setCustomization}
                  className="shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                />
              </div>

              <SavedCardCustomizationForm
                customization={customization}
                setCustomization={setCustomization}
                defaultBackground={defaultBackground}
                onError={setError}
                decorTool={decorTool}
                onDecorToolChange={setDecorTool}
                penColor={penColor}
                onPenColorChange={setPenColor}
                penWidth={penWidth}
                onPenWidthChange={setPenWidth}
              />
            </div>

            {error ? (
              <p className="mt-4 text-center text-sm text-red-600">{error}</p>
            ) : null}
          </div>

          <div className="shrink-0 flex flex-col gap-2 border-t border-neutral-100 px-6 py-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`${brandPillBtn} justify-center disabled:opacity-50`}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                '내 앨범에 저장'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary disabled:opacity-50">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
