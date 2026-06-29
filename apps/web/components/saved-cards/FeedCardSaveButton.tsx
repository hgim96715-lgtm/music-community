'use client';

import { ACTION_BTN, ACTION_ICON, COUNT_SLOT } from '@/lib/feedCardActions';
import { Bookmark } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { SavedCardEditorDialog } from './SavedCardEditorDialog';
import type { SavedCardPreviewData } from './SavedCardPreview';
import { useSavedCardsFeed } from './SavedCardsFeedContext';

type FeedCardSaveButtonProps = {
  recommendationId: string;
  authorId: string;
  preview: SavedCardPreviewData;
  background?: string;
  onHint?: (message: string) => void;
};

export function FeedCardSaveButton({
  recommendationId,
  authorId,
  preview,
  background,
  onHint,
}: FeedCardSaveButtonProps) {
  const { user } = useAuth();
  const { isSaved, markSaved } = useSavedCardsFeed();
  const [editorOpen, setEditorOpen] = useState(false);

  if (user?.role === 'admin') return null;
  if (user?.id !== authorId) return null;

  const saved = isSaved(recommendationId);

  function handleClick() {
    if (saved) {
      onHint?.('이미 앨범에 저장했어요');
      return;
    }
    setEditorOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={saved ? '앨범에 저장됨' : '내 앨범에 저장'}
        aria-pressed={saved}
        className={`${ACTION_BTN} text-neutral-500 hover:text-neutral-800`}>
        <Bookmark
          className={`${ACTION_ICON} ${saved ? 'fill-brand-primary text-brand-primary' : ''}`}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className={`${COUNT_SLOT} invisible`} aria-hidden>
          0
        </span>
      </button>

      <SavedCardEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        recommendationId={recommendationId}
        preview={preview}
        defaultBackground={background}
        onSaved={() => {
          markSaved(recommendationId);
          onHint?.('내 앨범에 저장했어요');
        }}
      />
    </>
  );
}
