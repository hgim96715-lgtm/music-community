'use client';

import { EmbedPlaybackFallback } from './EmbedPlaybackFallback';
import { YouTubeFeedEmbed } from './YouTubeFeedEmbed';
import {
  fetchSpotifyThumbnailUrl,
  getEmbedPreview,
  parseYouTubeVideoId,
  spotifyEmbedHeight,
  youtubeWatchUrl,
} from '@/lib/embedMedia';
import { embedPlayerFooter, embedPlayerShell } from '@/lib/neobrutal';
import { ChevronUp, Music2, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type FeedCardMediaProps = {
  embedUrl: string;
  title: string;
  artist: string;
};

export function FeedCardMedia({ embedUrl, title, artist }: FeedCardMediaProps) {
  const [playing, setPlaying] = useState(false);
  const [youtubeBlocked, setYoutubeBlocked] = useState(false);
  const [spotifyThumb, setSpotifyThumb] = useState<string | null>(null);
  const preview = getEmbedPreview(embedUrl);

  useEffect(() => {
    if (preview.platform !== 'spotify') {
      setSpotifyThumb(null);
      return;
    }
    let cancelled = false;
    fetchSpotifyThumbnailUrl(embedUrl).then((url) => {
      if (!cancelled) setSpotifyThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [embedUrl, preview.platform]);

  const handleClose = useCallback(() => {
    setPlaying(false);
    setYoutubeBlocked(false);
  }, []);

  const handleYoutubeBlocked = useCallback(() => {
    setYoutubeBlocked(true);
  }, []);

  const thumbnailUrl =
    preview.platform === 'youtube'
      ? preview.thumbnailUrl
      : preview.platform === 'spotify'
        ? spotifyThumb
        : null;

  if (playing) {
    const videoId =
      preview.platform === 'youtube' ? parseYouTubeVideoId(embedUrl) : null;

    if (preview.platform === 'youtube' && youtubeBlocked && videoId) {
      return (
        <EmbedPlaybackFallback
          thumbnailUrl={preview.thumbnailUrl}
          message="앱 안에서는 재생할 수 없어요 😭"
          externalHref={youtubeWatchUrl(videoId)}
          externalLabel="YouTube로 가볼까요? 🚀"
          onClose={handleClose}
        />
      );
    }
    const iframeAllow =
      preview.platform === 'youtube'
        ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        : 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';

    return (
      <div className={embedPlayerShell}>
        {preview.platform === 'youtube' ? (
          <YouTubeFeedEmbed
            embedUrl={embedUrl}
            title={title}
            onEmbedBlocked={handleYoutubeBlocked}
          />
        ) : preview.platform === 'spotify' ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full border-0"
            style={{ height: spotifyEmbedHeight(preview.spotifyKind) }}
            allow={iframeAllow}
            loading="lazy"
          />
        ) : (
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              title={title}
              className="h-full w-full"
              allow={iframeAllow}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleClose}
          className={embedPlayerFooter}>
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          접기
        </button>
      </div>
    );
  }

  const platformLabel =
    preview.platform === 'spotify'
      ? 'Spotify'
      : preview.platform === 'youtube'
        ? 'YouTube'
        : null;

  /* quiet 트랙 — 밝은 베이지 면 ❌ · 얇은 브라스 라인만 */
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-[rgb(201_166_107/0.14)] bg-[rgb(255_255_255/0.04)] px-2.5 py-2 text-left transition-colors hover:border-[rgb(201_166_107/0.28)] hover:bg-[rgb(255_255_255/0.07)]">
      <span className="relative flex size-12 shrink-0 items-center justify-center">
        {thumbnailUrl ? (
          <span
            className="lp-disc absolute inset-0 size-full motion-safe:group-hover:animate-[lp-spin_12s_linear_infinite]"
            aria-hidden>
            <img src={thumbnailUrl} alt="" />
            <span className="lp-disc-label" />
          </span>
        ) : (
          <span
            className="lp-disc lp-disc-fallback absolute inset-0 size-full motion-safe:group-hover:animate-[lp-spin_12s_linear_infinite]"
            aria-hidden>
            <Music2 className="relative z-[1] size-3.5 text-[#a89880]" />
            <span className="lp-disc-label" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1 overflow-hidden font-sans">
        <span
          className="block truncate text-sm font-semibold text-[#ebe4da]"
          title={title}>
          {title}
        </span>
        <span
          className="mt-0.5 block truncate text-xs font-medium text-[#a89880]"
          title={artist}>
          {artist}
          {platformLabel ? (
            <span className="text-[#8a7a68]">
              {' '}
              · {platformLabel}
            </span>
          ) : null}
        </span>
      </span>

      <span
        className="grid size-8 shrink-0 place-items-center rounded-full border border-[rgb(201_166_107/0.28)] text-[#c9a66b] transition-colors duration-150 group-hover:border-[rgb(201_166_107/0.45)] group-hover:bg-[rgb(201_166_107/0.1)]"
        aria-hidden>
        <Play className="size-3 fill-current" />
      </span>

      <span className="sr-only">
        {title} · {artist} 재생
      </span>
    </button>
  );
}
