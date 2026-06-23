"use client";
import { formatDisplayDate } from "@/lib/date";
import { getMoodPalette, getPrimaryMoodPalette } from "@/lib/moods";
import { Recommendation } from "@/lib/types";
import { Heart } from "lucide-react";
import { toggleLikeAction, ToggleLikeActionState } from "./actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";


const initialState:ToggleLikeActionState={};

type Props = {
  recommendation: Recommendation;
};


function LikeButton({
    liked,
    likeCount,
}:{
    liked:boolean,
    likeCount:number
}){
    const { pending } = useFormStatus();

    // liked → 빨강 채움 · likeCount>0(남이 누름) → 회색 채움 · 0 → 회색 빈 하트
    const heartClass = liked
      ? "text-red-500"
      : likeCount > 0
        ? "text-neutral-400"
        : "text-neutral-600";
    const heartFill = liked || likeCount > 0 ? "currentColor" : "none";

    return (
        <button
            type="submit"
            disabled={pending}
            aria-pressed={liked}
            className="flex items-center gap-1 disabled:opacity-50"
        >
            <Heart
                className={`size-4 ${heartClass}`}
                fill={heartFill}
                aria-hidden
            />
            <span className="text-neutral-600">{likeCount}</span>
        </button>
    );
}

export default function FeedCard({ recommendation }: Props) {
const [state,formAction]=useActionState(toggleLikeAction,initialState)
  const { id, author, title, artist, embedUrl, reason, moods, likeCount:initialLikeCount, likedByMe, createdAt} =
    recommendation;
  const liked=state.liked ?? likedByMe ?? false;
  const likeCount=state.likeCount ?? initialLikeCount;
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

        <footer className="border-t border-neutral-100 px-4 py-2.5 text-sm">
            <form action={formAction}>
                <input type="hidden" name="recommendationId" value={id} />
                {state.error && (
                    <p className="mb-1 text-xs text-red-500">{state.error}</p>
                )}
               <LikeButton liked={liked} likeCount={likeCount} />
            </form>
          
        </footer>
      </div>
    </article>
  );
}
