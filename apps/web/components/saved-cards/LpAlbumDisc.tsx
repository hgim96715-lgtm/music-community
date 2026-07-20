'use client';

import {
  fetchSpotifyThumbnailUrl,
  getEmbedPreview,
} from '@/lib/embedMedia';
import { Music2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type LpAlbumDiscProps = {
  embedUrl?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  pulled?: boolean;
  dimmed?: boolean;
  empty?: boolean;
  label?: string;
  className?: string;
};

const SIZE_CLASS = {
  sm: 'size-11',
  md: 'size-14',
  lg: 'size-[4.75rem]',
} as const;

/** 앨범 책장·Top용 원형 LP 커버 */
export function LpAlbumDisc({
  embedUrl = '',
  title = '',
  size = 'md',
  pulled = false,
  dimmed = false,
  empty = false,
  label,
  className = '',
}: LpAlbumDiscProps) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (empty || !embedUrl) {
      setThumb(null);
      return;
    }
    const preview = getEmbedPreview(embedUrl);
    if (preview.platform === 'youtube') {
      setThumb(preview.thumbnailUrl);
      return;
    }
    if (preview.platform !== 'spotify') {
      setThumb(null);
      return;
    }
    let cancelled = false;
    fetchSpotifyThumbnailUrl(embedUrl).then((url) => {
      if (!cancelled) setThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [embedUrl, empty]);

  if (empty) {
    return (
      <span
        className={`lp-album-disc lp-album-disc-empty ${SIZE_CLASS[size]} ${className}`}
        aria-hidden>
        {label ? <span className="lp-album-disc-slot">{label}</span> : null}
      </span>
    );
  }

  return (
    <span
      className={`lp-album-disc ${SIZE_CLASS[size]} ${pulled ? 'is-pulled' : ''} ${dimmed ? 'is-dimmed' : ''} ${className}`}
      aria-hidden>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element -- oEmbed / YouTube CDN
        <img src={thumb} alt="" />
      ) : (
        <Music2 className="relative z-[1] h-1/3 w-1/3 text-neutral-400" />
      )}
      <span className="lp-album-disc-label" />
      <span className="sr-only">{title}</span>
    </span>
  );
}
