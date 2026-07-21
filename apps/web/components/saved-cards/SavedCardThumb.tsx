import type { ApiSavedCard } from '@/lib/apiTypes';
import { LpAlbumJacket } from './LpAlbumJacket';

type SavedCardThumbProps = {
  card: ApiSavedCard;
};

export function SavedCardThumb({ card }: SavedCardThumbProps) {
  const { recommendation, customization } = card;

  return (
    <LpAlbumJacket
      size="sm"
      title={recommendation.title}
      artist={recommendation.artist}
      embedUrl={recommendation.embedUrl}
      reason={recommendation.reason}
      moods={recommendation.moods}
      postedAt={recommendation.createdAt}
      savedAt={card.createdAt}
      customization={customization}
    />
  );
}
