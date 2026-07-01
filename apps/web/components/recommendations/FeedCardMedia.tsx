'use client';

import { EmbedPlaybackFallback } from './EmbedPlaybackFallback';
import { YouTubeFeedEmbed } from './YouTubeFeedEmbed';
import {
  getEmbedPreview,
  parseYouTubeVideoId,
  spotifyEmbedHeight,
  youtubeWatchUrl,
} from '@/lib/embedMedia';
import { embedPlayerFooter, embedPlayerShell, playButton, trackCard } from '@/lib/neobrutal';
import { ChevronUp, Music2, Play } from 'lucide-react';
import { useCallback, useState } from 'react';

type FeedCardMediaProps = {
  embedUrl: string;
  title: string;
  artist: string;
};

export function FeedCardMedia({ embedUrl, title, artist }: FeedCardMediaProps) {
  const [playing, setPlaying] = useState(false);
  const [youtubeBlocked, setYoutubeBlocked] = useState(false);
  const preview = getEmbedPreview(embedUrl);

  const handleClose = useCallback(() => {
    setPlaying(false);
    setYoutubeBlocked(false);
  }, []);

  const handleYoutubeBlocked = useCallback(() => {
    setYoutubeBlocked(true);
  }, []);

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
        : '재생';
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={trackCard}>
      {preview.thumbnailUrl ? (
        <img
          src={preview.thumbnailUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-black/[0.05]"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-200/50 text-neutral-500">
          {preview.platform === 'spotify' ? (
            <span className="font-sans text-[0.625rem] font-semibold tracking-wide">
              {platformLabel}
            </span>
          ) : (
            <Music2 className="h-5 w-5" aria-hidden />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1 overflow-hidden font-sans">
        <span
          className="block truncate text-sm font-semibold text-neutral-900"
          title={title}>
          {title}
        </span>
        <span
          className="mt-0.5 block truncate text-xs font-normal text-neutral-500"
          title={artist}>
          {artist}
        </span>
      </span>
      <span className={playButton} aria-hidden>
        <Play className="h-3.5 w-3.5 fill-current" />
      </span>
      <span className="sr-only">
        {title} · {artist} 재생
      </span>
    </button>
  );
}
