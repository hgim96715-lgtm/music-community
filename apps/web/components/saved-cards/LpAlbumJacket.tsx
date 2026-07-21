'use client';

import type { ApiSavedCardCustomization } from '@/lib/apiTypes';
import { formatFeedDate } from '@/lib/date';
import {
  fetchSpotifyThumbnailUrl,
  getEmbedPreview,
} from '@/lib/embedMedia';
import { getMoodColors } from '@/lib/moodColors';
import { DEFAULT_TEXT_COLORS } from '@/lib/savedCardColors';
import { Music2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type DisplayKey =
  | 'title'
  | 'artist'
  | 'reason'
  | 'moods'
  | 'postedAt'
  | 'savedAt';

type LpAlbumJacketProps = {
  title: string;
  artist: string;
  embedUrl: string;
  reason?: string;
  moods?: string[];
  postedAt?: string;
  savedAt?: string;
  customization?: ApiSavedCardCustomization | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASS = {
  sm: 'w-[7.5rem]',
  md: 'w-full max-w-[9.5rem]',
  lg: 'w-full max-w-[14rem]',
} as const;

const DISPLAY_ON_BY_DEFAULT = new Set<DisplayKey>([
  'title',
  'artist',
  'reason',
  'moods',
]);

function isOn(
  display: ApiSavedCardCustomization['display'],
  key: DisplayKey,
) {
  const v = display?.[key];
  if (DISPLAY_ON_BY_DEFAULT.has(key)) return v !== false;
  return v === true;
}

function textColor(
  customization: ApiSavedCardCustomization | null,
  key: keyof typeof DEFAULT_TEXT_COLORS,
) {
  return customization?.textColors?.[key] ?? DEFAULT_TEXT_COLORS[key];
}

/**
 * LP 자켓(사각 커버) — 꾸미기·방 공유·채팅
 * 커스텀 이미지 없으면 embed 앨범 표지
 */
export function LpAlbumJacket({
  title,
  artist,
  embedUrl,
  reason = '',
  moods = [],
  postedAt,
  savedAt,
  customization = null,
  size = 'md',
  className = '',
}: LpAlbumJacketProps) {
  const customImage = customization?.backgroundImage?.trim() || null;
  const tint = customization?.background;
  const imageOpacity = customization?.backgroundImageOpacity ?? 1;
  const showTitle = isOn(customization?.display, 'title');
  const showArtist = isOn(customization?.display, 'artist');
  const showReason = isOn(customization?.display, 'reason') && Boolean(reason);
  const showMoods = isOn(customization?.display, 'moods') && moods.length > 0;
  const showPostedAt =
    isOn(customization?.display, 'postedAt') && Boolean(postedAt);
  const showSavedAt = isOn(customization?.display, 'savedAt');
  const compact = size === 'sm';
  const comfortable = size === 'lg';
  const [albumThumb, setAlbumThumb] = useState<string | null>(null);

  useEffect(() => {
    if (customImage || !embedUrl) {
      setAlbumThumb(null);
      return;
    }
    const preview = getEmbedPreview(embedUrl);
    if (preview.platform === 'youtube') {
      setAlbumThumb(preview.thumbnailUrl);
      return;
    }
    if (preview.platform !== 'spotify') {
      setAlbumThumb(null);
      return;
    }
    let cancelled = false;
    fetchSpotifyThumbnailUrl(embedUrl).then((url) => {
      if (!cancelled) setAlbumThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [customImage, embedUrl]);

  const coverSrc = customImage || albumThumb;
  const showBottom =
    showTitle ||
    showArtist ||
    showReason ||
    showPostedAt ||
    showSavedAt;

  return (
    <span
      className={`lp-album-jacket relative block aspect-square overflow-hidden rounded-md ${SIZE_CLASS[size]} ${className}`}
      style={
        !coverSrc && tint
          ? { backgroundColor: tint }
          : { backgroundColor: 'var(--color-lp-ink)' }
      }>
      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- oEmbed / data URL
        <img
          src={coverSrc}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={
            customImage && imageOpacity < 1
              ? { opacity: imageOpacity }
              : undefined
          }
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <Music2 className="size-8 text-[color:var(--color-lp-muted)]" />
        </span>
      )}
      {tint && coverSrc ? (
        <span
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{ backgroundColor: tint, opacity: 0.28 }}
          aria-hidden
        />
      ) : null}
      {showMoods ? (
        <span
          className={`pointer-events-none absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-0.75rem)] flex-wrap gap-1 ${
            compact ? 'left-1 top-1' : ''
          }`}>
          {moods.map((mood) => {
            const colors = getMoodColors(mood);
            return (
              <span
                key={mood}
                className={`mood-pill-depth rounded-md border px-1.5 py-0.5 font-semibold shadow-sm ${
                  compact
                    ? 'text-[7px]'
                    : comfortable
                      ? 'text-[10px]'
                      : 'text-[8px]'
                } ${colors.pillBg} ${colors.pillText} ${colors.pillBorder}`}>
                {mood}
              </span>
            );
          })}
        </span>
      ) : null}
      {showBottom ? (
        <span
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(20_17_14/0.92)] via-[rgb(20_17_14/0.45)] to-transparent ${
            comfortable ? 'px-2.5 pb-2.5 pt-12' : 'px-2 pb-2 pt-10'
          }`}>
          {showTitle ? (
            <span
              className={`block truncate font-semibold leading-tight ${
                compact
                  ? 'text-[10px]'
                  : comfortable
                    ? 'text-[12px]'
                    : 'text-[11px]'
              }`}
              style={{ color: textColor(customization, 'title') }}>
              {title}
            </span>
          ) : null}
          {showArtist ? (
            <span
              className={`block truncate leading-tight ${
                showTitle ? 'mt-0.5' : ''
              } ${
                compact
                  ? 'text-[8px]'
                  : comfortable
                    ? 'text-[10px]'
                    : 'text-[9px]'
              }`}
              style={{ color: textColor(customization, 'artist') }}>
              {artist}
            </span>
          ) : null}
          {showReason ? (
            <span
              className={`mt-1 block line-clamp-2 leading-snug ${
                compact
                  ? 'text-[7px]'
                  : comfortable
                    ? 'text-[10px]'
                    : 'text-[8px]'
              }`}
              style={{ color: textColor(customization, 'reason') }}>
              {reason}
            </span>
          ) : null}
          {showPostedAt || showSavedAt ? (
            <span
              className={`mt-1 block space-y-0.5 leading-tight ${
                compact
                  ? 'text-[7px]'
                  : comfortable
                    ? 'text-[9px]'
                    : 'text-[8px]'
              }`}>
              {showPostedAt && postedAt ? (
                <span
                  className="block"
                  style={{ color: textColor(customization, 'postedAt') }}>
                  올림 {formatFeedDate(postedAt)}
                </span>
              ) : null}
              {showSavedAt ? (
                <span
                  className="block"
                  style={{ color: textColor(customization, 'savedAt') }}>
                  저장 {savedAt ? formatFeedDate(savedAt) : '저장 시 표시'}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-[rgb(201_166_107/0.35)]" />
    </span>
  );
}
