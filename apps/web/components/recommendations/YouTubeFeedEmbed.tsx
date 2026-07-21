'use client';

import {
  isYouTubeEmbedBlockedError,
  parseYouTubeVideoId,
} from '@/lib/embedMedia';
import { useEffect, useId, useRef } from 'react';

// @types/youtube — 타입만. 실제 YT는 아래 스크립트 로드 후 생김
// playerRef: unmount·접기 시 destroy() 하려고 인스턴스 보관

/** bundler 해석에서 @types/youtube ambient가 안 잡힐 때용 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- YouTube IFrame API
  namespace YT {
    class Player {
      constructor(
        elementId: string,
        options: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            rel?: number;
            start?: number;
          };
          events?: {
            onError?: (e: { data: number }) => void;
          };
        },
      );
      destroy(): void;
    }
  }
}

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

// onYouTubeIframeAPIReady
// 페이지에서 플레이어 API의 JavaScript 다운로드를 완료하면 API가 이 함수를 호출하여 페이지에서 API를 사용할 수 있게 됩니다.
//  따라서 이 함수에서는 페이지 로드 시 표시할 플레이어 개체를 만들어야 합니다.

function loadYoutubeIframeApi(): Promise<typeof YT> {
  const win = window as typeof window & {
    YT?: typeof YT;
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
        // satisfies: PlayerVars에 맞는지 검사 + 스프레드로 타입 안 넓히기
        const playerVars = (
          startSec != null && startSec > 0
            ? { autoplay: 1, rel: 0, start: startSec }
            : { autoplay: 1, rel: 0 }
        ) satisfies YouTubePlayerVars;

        playerRef.current = new YTApi.Player(containerId, {
          videoId,
          playerVars,
          events: {
            onError: (e) => {
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
      {/* YT.Player가 이 div를 찾아서 안에 플레이어 삽입!!!!! */}
      <div id={containerId} title={title} className="h-full w-full" />
    </div>
  );
}
