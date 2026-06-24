import { Recommendation } from '@/lib/types';
import { Heart } from 'lucide-react';

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

  /*내가 좋아요 했는지 여부 true 면 좋아요 버튼 빨간색*/
  const liked = likedByMe ?? false;

  return (
    <article>
      <header className="mb-2 text-sm text-neutral-600">
        @{author.nickname}
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
        <Heart
          className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`}
          aria-hidden
        />
        <span className="text-sm">{likeCount}</span>
        <time className="ml-auto text-xs text-neutral-400" dateTime={createdAt}>
          {createdAt}
        </time>
      </footer>
    </article>
  );
}
