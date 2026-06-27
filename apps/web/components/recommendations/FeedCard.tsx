import type { CSSProperties } from 'react';
import { Recommendation } from '@/lib/types';
import { formatFeedDate } from '@/lib/date';
import { getMoodColors } from '@/lib/moodColors';
import { neoHeaderDefault, postCard, postCardShell } from '@/lib/neobrutal';
import { FeedCardFooter } from './FeedCardFooter';
import { FeedCardMedia } from './FeedCardMedia';
import { FeedCardMenu } from './FeedCardMenu';

type FeedCardProps = {
  recommendation: Recommendation;
};

export function FeedCard({ recommendation }: FeedCardProps) {
  const {
    id,
    title,
    artist,
    embedUrl,
    reason,
    moods,
    likeCount,
    likedByMe,
    author,
    createdAt,
  } = recommendation;

  const headerMood = moods[0] ? getMoodColors(moods[0]) : null;
  const headerBand = headerMood?.pillBg ?? neoHeaderDefault.band;
  const headerNicknameClass =
    headerMood?.pillText ?? neoHeaderDefault.text;
  const headerDateClass = headerMood?.pillText ?? neoHeaderDefault.muted;
  const cardBack = headerMood?.cardBack ?? neoHeaderDefault.cardBack;

  return (
    <div
      className={postCardShell}
      style={{ '--card-back': cardBack } as CSSProperties}>
      <article className={postCard}>
        <header
          className={`flex items-center justify-between gap-3 border-b border-[#353535]/15 px-4 py-3 ${headerBand}`}>
          <span
            className={`min-w-0 truncate text-sm font-semibold leading-5 [font-family:ui-sans-serif,system-ui,sans-serif] ${headerNicknameClass}`}>
            @{author.nickname}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <time
              className={`text-xs font-medium leading-5 opacity-80 ${headerDateClass}`}
              dateTime={createdAt}>
              {formatFeedDate(createdAt)}
            </time>
            <FeedCardMenu recommendationId={id} variant="neo" />
          </div>
        </header>

        <div className="p-4">
          <FeedCardMedia embedUrl={embedUrl} title={title} artist={artist} />

          <p className="mt-3.5 break-words font-sans text-[0.9375rem] font-normal leading-[1.65] text-neutral-700 [overflow-wrap:anywhere]">
            {reason}
          </p>

          <FeedCardFooter
            recommendationId={id}
            moods={moods}
            likeCount={likeCount}
            likedByMe={likedByMe}
          />
        </div>
      </article>
    </div>
  );
}
