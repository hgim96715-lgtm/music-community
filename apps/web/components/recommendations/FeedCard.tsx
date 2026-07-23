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

  const { band, text, muted, cardBack } = neoHeaderDefault;

  return (
    <div
      className={postCardShell}
      style={{ '--card-back': cardBack } as CSSProperties}>
      <article className={postCard}>
        <header
          className={`flex items-center justify-between gap-3 border-b border-[rgb(201_166_107/0.12)] px-4 py-2.5 ${band}`}>
          <FeedAuthorNickname
            userId={author.id}
            nickname={author.nickname}
            className={`text-[0.8125rem] font-semibold leading-5 tracking-tight ${text}`}
          />

          <div className="flex shrink-0 items-center gap-0.5">
            <time
              className={`text-[0.6875rem] font-medium leading-5 ${muted}`}
              dateTime={createdAt}>
              {formatFeedDate(createdAt)}
            </time>
            <FeedCardMenu
              recommendationId={id}
              createdAt={createdAt}
              authorId={author.id}
              variant="neo"
              onDeleted={onDeleted}
            />
          </div>
        </header>

        <div className="p-4">
          <FeedCardMedia embedUrl={embedUrl} title={title} artist={artist} />

          <p className="mt-3.5 break-words whitespace-pre-line font-sans text-[0.9375rem] font-normal leading-[1.65] text-[#d4c8b8] [overflow-wrap:anywhere]">
            {reason}
          </p>

          <FeedCardFooter
            recommendationId={id}
            authorId={author.id}
            cardBackground={cardBack}
            title={title}
            artist={artist}
            embedUrl={embedUrl}
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
