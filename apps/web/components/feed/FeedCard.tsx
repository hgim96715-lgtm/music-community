import { formatDisplayDate } from "@/lib/date";
import { getMoodPalette, getPrimaryMoodPalette } from "@/lib/moods";
import { Recommendation } from "@/lib/types";
import { Heart } from "lucide-react";

type Props = {
  recommendation: Recommendation;
};

export default function FeedCard({ recommendation }: Props) {
  const { author, title, artist, embedUrl, reason, moods, likeCount, createdAt } =
    recommendation;
  const cardPalette = getPrimaryMoodPalette(moods);

  return (
    <article
      className={`flex overflow-hidden rounded-xl border border-neutral-200 shadow-sm ${cardPalette.tintClass}`}
    >
      <div
        className={`w-1 shrink-0 ${cardPalette.accentClass}`}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2 px-4 py-3 text-sm">
          <span className="font-semibold text-neutral-900">@{author.nickname}</span>
          <span className="text-neutral-400">·</span>
          <time className="text-neutral-500" dateTime={createdAt}>
            {formatDisplayDate(createdAt)}
          </time>
        </header>

        <div className="aspect-video w-full bg-neutral-100">
          <iframe
            src={embedUrl}
            title={`${title} - ${artist}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="space-y-2 px-4 py-3">
          <p className="font-medium text-neutral-900">
            {title} - {artist}
          </p>
          <p className="text-sm leading-relaxed text-neutral-700">{reason}</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {moods.map((mood) => (
              <span
                key={mood}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getMoodPalette(mood).pillClass}`}
              >
                {mood}
              </span>
            ))}
          </div>
        </div>

        <footer className="border-t border-neutral-100 px-4 py-2.5 text-sm text-neutral-600">
          <Heart className="mr-1 inline-block size-4" /> {likeCount}
        </footer>
      </div>
    </article>
  );
}
