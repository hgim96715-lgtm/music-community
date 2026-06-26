import { Recommendation } from '@/lib/types';
import { formatFeedDate } from '@/lib/date';
import { HeartButton } from './HeartButton';

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

  return (
    <article>
      <header className="mb-2 flex items-center justify-between text-sm text-neutral-600">
        <span>@{author.nickname}</span>
        <time className="text-xs text-neutral-400" dateTime={createdAt}>
          {formatFeedDate(createdAt)}
        </time>
      </header>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-neutral-600">{artist}</p>
      {/* embed — 3단계는 iframe만 (URL 검증은 Nest가 함) */}
      <div className="my-3 aspect-video w-full overflow-hidden rounded-md bg-neutral-100">
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="text-sm text-neutral-800">{reason}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {moods.map((mood) => (
          <span
            key={mood}
            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
            {mood}
          </span>
        ))}
      </div>
      <footer className="mt-3 flex items-center gap-2 text-neutral-600">
        <HeartButton
          recommendationId={id}
          likedByMe={likedByMe}
          likeCount={likeCount}
        />
      </footer>
    </article>
  );
}
