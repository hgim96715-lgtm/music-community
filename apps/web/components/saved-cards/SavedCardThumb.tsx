import type { ApiSavedCard } from '@/lib/apiTypes';
import { SavedCardPreview } from './SavedCardPreview';

type SavedCardThumbProps = {
  card: ApiSavedCard;
};

export function SavedCardThumb({ card }: SavedCardThumbProps) {
  const { recommendation, customization } = card;

  return (
    <SavedCardPreview
      size="thumb"
      data={{
        title: recommendation.title,
        artist: recommendation.artist,
        reason: recommendation.reason,
        moods: recommendation.moods,
        postedAt: recommendation.createdAt,
        savedAt: card.createdAt,
      }}
      customization={customization}
    />
  );
}
