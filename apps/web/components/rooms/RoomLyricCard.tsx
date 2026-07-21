'use client';

import {
  fetchSpotifyThumbnailUrl,
  getEmbedPreview,
} from '@/lib/embedMedia';
import { Music2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RoomSongCardData } from './RoomSongCard';

export type RoomLyricCardData = RoomSongCardData & {
  lyrics: string;
  startSec?: number | null;
  endSec?: number | null;
  /** 카드 배경 (꾸미기 확장용). 기본 웜 우드 */
  background?: string;
};

type RoomLyricCardProps = {
  data: RoomLyricCardData;
  onPlay?: () => void;
  /** chat: 채팅 · compose: 시트 미리보기 */
  size?: 'chat' | 'compose';
  className?: string;
};

/** Spotify 공유 카드 톤에 맞춘 기본 배경 (브랜드 우드) */
export const LYRIC_CARD_DEFAULT_BG = '#4a3728';

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function rangeLabel(startSec?: number | null, endSec?: number | null) {
  if (startSec == null && endSec == null) return null;
  if (startSec != null && endSec != null) {
    return `${formatSec(startSec)} – ${formatSec(endSec)}`;
  }
  if (startSec != null) return `${formatSec(startSec)}~`;
  return `~${formatSec(endSec!)}`;
}

function useEmbedThumb(embedUrl: string) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!embedUrl) {
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
  }, [embedUrl]);

  return thumb;
}

/** 방 채팅 · Spotify형 가사 공유 카드 */
export function RoomLyricCard({
  data,
  onPlay,
  size = 'chat',
  className = '',
}: RoomLyricCardProps) {
  const thumb = useEmbedThumb(data.embedUrl);
  const range = rangeLabel(data.startSec, data.endSec);
  const bg = data.background ?? LYRIC_CARD_DEFAULT_BG;
  const trimmed = data.lyrics.trim();
  const isPlaceholder = !trimmed && size === 'compose';
  const lyricsText = trimmed || (isPlaceholder ? '가사를 입력하면\n여기에 보여요' : '');

  const body = (
    <>
      <span className="lyric-share-card-meta">
        <span className="lyric-share-card-cover">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- oEmbed / YouTube CDN
            <img src={thumb} alt="" />
          ) : (
            <Music2 className="size-4 opacity-70" aria-hidden />
          )}
        </span>
        <span className="lyric-share-card-titles">
          <span className="lyric-share-card-title">{data.title}</span>
          <span className="lyric-share-card-artist">{data.artist}</span>
        </span>
      </span>

      <span
        className={`lyric-share-card-lyrics${isPlaceholder ? ' is-placeholder' : ''}`}>
        {lyricsText}
      </span>

      <span className="lyric-share-card-foot">
        <span className="lyric-share-card-brand">Music Community</span>
        {range ? (
          <span className="lyric-share-card-range">{range}</span>
        ) : null}
        {onPlay ? (
          <span className="lyric-share-card-play" aria-hidden>
            <Play className="size-3 fill-current" />
          </span>
        ) : null}
      </span>
      {onPlay ? (
        <span className="sr-only">
          {data.title} · 가사 구간 재생
        </span>
      ) : null}
    </>
  );

  const cardClassName = `lyric-share-card lyric-share-card--${size} ${className}`.trim();
  const style = { backgroundColor: bg };

  if (onPlay) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className={cardClassName}
        style={style}>
        {body}
      </button>
    );
  }

  return (
    <div className={cardClassName} style={style}>
      {body}
    </div>
  );
}
