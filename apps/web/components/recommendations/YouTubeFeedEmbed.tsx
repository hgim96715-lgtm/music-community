'use client';

import {
  isYouTubeEmbedBlockedError,
  parseYouTubeVideoId,
} from '@/lib/embedMedia';
import { useEffect, useId, useRef } from 'react';

// 타입: @types/youtube (+ types/youtube-iframe.d.ts)
// 로컬 declare global { namespace YT } ❌ — Vercel에서 Player 중복

type YouTubeApi = {
  Player: new (elementId: string, options?: YT.PlayerOptions) => YT.Player;
};

type YouTubeFeedEmbedProps = {
  embedUrl: string;
  title: string;
  onEmbedBlocked: () => void;
  startSec?: number;
};

/** `satisfies`용 — 강제 검사 + 리터럴 추론 유지 */
type YouTubePlayerVars = {
  autoplay?: number;
  rel?: number;
  start?: number;
};

function loadYoutubeIframeApi(): Promise<YouTubeApi> {
  const win = window as Window & {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  };
  if (win.YT?.Player) return Promise.resolve(win.YT);

  return new Promise((resolve, reject) => {
    const prev = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (win.YT?.Player) resolve(win.YT);
      else reject(new Error('YouTube IFrame API 로드 실패'));
    };

    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )
    ) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('YouTube IFrame API 로드 실패'));
      document.head.appendChild(script);
    }
  });
}

export function YouTubeFeedEmbed({
  embedUrl,
  title,
  onEmbedBlocked,
  startSec,
}: YouTubeFeedEmbedProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerId = `yt-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const videoId = parseYouTubeVideoId(embedUrl);
    if (!videoId) {
      onEmbedBlocked();
      return;
    }
    let cancelled = false;
    loadYoutubeIframeApi()
      .then((YTApi) => {
        if (cancelled) return;
        const playerVars = (
          startSec != null && startSec > 0
            ? { autoplay: 1, rel: 0, start: startSec }
            : { autoplay: 1, rel: 0 }
        ) satisfies YouTubePlayerVars;

        playerRef.current = new YTApi.Player(containerId, {
          videoId,
          playerVars,
          events: {
            onError: (e: YT.OnErrorEvent) => {
              if (isYouTubeEmbedBlockedError(e.data)) onEmbedBlocked();
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) onEmbedBlocked();
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, embedUrl, onEmbedBlocked, startSec]);

  return (
    <div className="aspect-video w-full">
      <div id={containerId} title={title} className="h-full w-full" />
    </div>
  );
}
