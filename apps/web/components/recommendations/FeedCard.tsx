import type { CSSProperties } from 'react';
import { Recommendation } from '@/lib/types';
import { formatFeedDate } from '@/lib/date';
import { neoHeaderDefault, postCard, postCardShell } from '@/lib/neobrutal';
import { FeedAuthorNickname } from '@/components/friends/FeedAuthorNickname';
import { FeedCardFooter } from './FeedCardFooter';
import { FeedCardMedia } from './FeedCardMedia';
import { FeedCardMenu } from './FeedCardMenu';

type FeedCardProps = {
  recommendation: Recommendation;
  onDeleted?: (id: string) => void;
};

export function FeedCard({ recommendation, onDeleted }: FeedCardProps) {
  const {
    id,
    title,
    artist,
    embedUrl,
    reason,
    moods,
    likeCount,
    likedByMe,
    commentCount,
    author,
    createdAt,
  } = recommendation;

  /* P0: mood 색은 MoodPill만 — 헤더·cardBack은 종이·잉크 고정 */
  const { band, text, muted, cardBack } = neoHeaderDefault;

  return (
    <div
      className={postCardShell}
      style={{ '--card-back': cardBack } as CSSProperties}>
      <article className={postCard}>
        <header
          className={`flex items-center justify-between gap-3 border-b border-[rgb(42_34_28/0.12)] px-4 py-3 ${band}`}>
          <FeedAuthorNickname
            userId={author.id}
            nickname={author.nickname}
            className={`text-sm font-semibold leading-5 [font-family:ui-sans-serif,system-ui,sans-serif] ${text}`}
          />

          <div className="flex shrink-0 items-center gap-1">
            <time
              className={`text-xs font-medium leading-5 opacity-80 ${muted}`}
              dateTime={createdAt}>
              {formatFeedDate(createdAt)}
            </time>
            <FeedCardMenu
              recommendationId={id}
              authorId={author.id}
              variant="neo"
              onDeleted={onDeleted}
            />
          </div>
        </header>

        <div className="p-4">
          <FeedCardMedia embedUrl={embedUrl} title={title} artist={artist} />

          <p className="mt-3.5 break-words font-sans text-[0.9375rem] font-normal leading-[1.65] text-neutral-700 [overflow-wrap:anywhere]">
            {reason}
          </p>

          <FeedCardFooter
            recommendationId={id}
            authorId={author.id}
            cardBackground={cardBack}
            title={title}
            artist={artist}
            reason={reason}
            moods={moods}
            postedAt={createdAt}
            likeCount={likeCount}
            likedByMe={likedByMe}
            commentCount={commentCount}
          />
        </div>
      </article>
    </div>
  );
}
