'use client';

import type {
  ApiSavedCardCustomization,
  ApiSavedCardSticker,
  ApiSavedCardStroke,
} from '@/lib/apiTypes';
import { formatFeedDate } from '@/lib/date';
import {
  fetchSpotifyThumbnailUrl,
  getEmbedPreview,
} from '@/lib/embedMedia';
import { getMoodColors } from '@/lib/moodColors';
import { DEFAULT_TEXT_COLORS } from '@/lib/savedCardColors';
import { Music2 } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

type DisplayKey =
  | 'title'
  | 'artist'
  | 'reason'
  | 'moods'
  | 'postedAt'
  | 'savedAt';

export type JacketDecorTool = 'select' | 'pen';

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
  /** 14.6++ 편집 모드 — 미리보기에서 드래그·낙서 */
  decorTool?: JacketDecorTool;
  onCustomizationChange?: (next: ApiSavedCardCustomization) => void;
  penColor?: string;
  penWidth?: number;
};

/** 고정 rem — `w-full`은 부모(버튼 등) 너비가 비정일 때 모바일에서 0으로 접힘 */
const SIZE_CLASS = {
  sm: 'w-[7.5rem] shrink-0',
  md: 'w-[9.5rem] shrink-0',
  lg: 'w-[14rem] shrink-0',
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

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
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
  decorTool = 'select',
  onCustomizationChange,
  penColor = '#2c2418',
  penWidth = 2.5,
}: LpAlbumJacketProps) {
  const uid = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const drawing = useRef<ApiSavedCardStroke | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const customImage = customization?.backgroundImage?.trim() || null;
  const tint = customization?.background;
  const imageOpacity = customization?.backgroundImageOpacity ?? 1;
  const stickers = customization?.stickers ?? [];
  const strokes = customization?.strokes ?? [];
  const interactive = Boolean(onCustomizationChange);
  const showTitle = isOn(customization?.display, 'title');
  const showArtist = isOn(customization?.display, 'artist');
  const showReason = isOn(customization?.display, 'reason') && Boolean(reason);
  const showMoods = isOn(customization?.display, 'moods') && moods.length > 0;
  const showPostedAt =
    isOn(customization?.display, 'postedAt') && Boolean(postedAt);
  const showSavedAt = isOn(customization?.display, 'savedAt');
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
    showTitle || showArtist || showReason || showPostedAt || showSavedAt;

  function patchCustomization(partial: Partial<ApiSavedCardCustomization>) {
    if (!onCustomizationChange) return;
    onCustomizationChange({
      ...(customization ?? {}),
      ...partial,
    });
  }

  function toNorm(clientX: number, clientY: number) {
    const el = stageRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: clamp01((clientX - r.left) / r.width),
      y: clamp01((clientY - r.top) / r.height),
    };
  }

  function onStagePointerDown(e: ReactPointerEvent) {
    if (!interactive || decorTool !== 'pen') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toNorm(e.clientX, e.clientY);
    drawing.current = {
      id: `stroke-${uid}-${Date.now()}`,
      color: penColor,
      width: penWidth,
      points: [p],
    };
  }

  function onStagePointerMove(e: ReactPointerEvent) {
    if (!interactive) return;
    if (decorTool === 'pen' && drawing.current) {
      const p = toNorm(e.clientX, e.clientY);
      const draft = {
        ...drawing.current,
        points: [...drawing.current.points, p],
      };
      drawing.current = draft;
      const base = strokes.filter((s) => s.id !== draft.id);
      patchCustomization({ strokes: [...base, draft] });
      return;
    }
    if (dragIndex !== null) {
      const p = toNorm(e.clientX, e.clientY);
      const next = stickers.map((s, i) =>
        i === dragIndex ? { ...s, x: p.x, y: p.y } : s,
      );
      patchCustomization({ stickers: next });
    }
  }

  function onStagePointerUp() {
    drawing.current = null;
    setDragIndex(null);
  }

  function moveStickerStart(index: number, e: ReactPointerEvent) {
    if (!interactive || decorTool === 'pen') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
  }

  function removeSticker(index: number) {
    if (!interactive) return;
    patchCustomization({
      stickers: stickers.filter((_, i) => i !== index),
    });
  }

  return (
    <div
      ref={stageRef}
      className={`lp-album-jacket relative block aspect-square overflow-hidden rounded-md ${SIZE_CLASS[size]} ${className} ${
        interactive ? 'touch-none select-none' : ''
      }`}
      style={
        !coverSrc && tint
          ? { backgroundColor: tint }
          : { backgroundColor: 'var(--color-lp-ink)' }
      }
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}>
      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- oEmbed / data URL
        <img
          src={coverSrc}
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover"
          style={
            customImage && imageOpacity < 1
              ? { opacity: imageOpacity }
              : undefined
          }
        />
      ) : (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Music2 className="size-[14cqw] text-[color:var(--color-lp-muted)]" />
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
        <span className="pointer-events-none absolute left-[4cqw] top-[4cqw] z-10 flex max-w-[calc(100%-8cqw)] flex-wrap gap-[2cqw]">
          {moods.map((mood) => {
            const colors = getMoodColors(mood);
            return (
              <span
                key={mood}
                className={`mood-pill-depth rounded-[2cqw] border px-[3.5cqw] py-[1.5cqw] text-[4.5cqw] font-semibold shadow-sm ${colors.pillBg} ${colors.pillText} ${colors.pillBorder}`}>
                {mood}
              </span>
            );
          })}
        </span>
      ) : null}
      {showBottom ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-[rgb(20_17_14/0.92)] via-[rgb(20_17_14/0.45)] to-transparent px-[4.5cqw] pb-[4.5cqw] pt-[21cqw]">
          {showTitle ? (
            <span
              className="block truncate text-[5.4cqw] font-semibold leading-tight"
              style={{ color: textColor(customization, 'title') }}>
              {title}
            </span>
          ) : null}
          {showArtist ? (
            <span
              className={`block truncate text-[4.5cqw] leading-tight ${
                showTitle ? 'mt-[1.5cqw]' : ''
              }`}
              style={{ color: textColor(customization, 'artist') }}>
              {artist}
            </span>
          ) : null}
          {showReason ? (
            <span
              className="mt-[2.5cqw] block line-clamp-2 text-[4.5cqw] leading-snug"
              style={{ color: textColor(customization, 'reason') }}>
              {reason}
            </span>
          ) : null}
          {showPostedAt || showSavedAt ? (
            <span className="mt-[2.5cqw] block space-y-[1cqw] text-[4cqw] leading-tight">
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

      <StrokeLayer strokes={strokes} />

      {stickers.map((s, index) => (
        <StickerNode
          key={`${s.assetId}-${index}-${s.x.toFixed(3)}-${s.y.toFixed(3)}`}
          sticker={s}
          interactive={interactive}
          onPointerDown={(e) => moveStickerStart(index, e)}
          onDoubleClick={() => removeSticker(index)}
        />
      ))}

      <span className="pointer-events-none absolute inset-0 z-20 rounded-md ring-1 ring-inset ring-[rgb(201_166_107/0.35)]" />
    </div>
  );
}

/** 편집 미리보기(lg ≈ 14rem) 기준 — 스티커·선 두께를 자켓 너비에 비례 */
const JACKET_REF_PX = 224;
const STICKER_BASE_CQW = 11;

function StickerNode({
  sticker,
  interactive,
  onPointerDown,
  onDoubleClick,
}: {
  sticker: ApiSavedCardSticker;
  interactive: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onDoubleClick: () => void;
}) {
  const style = {
    left: `${sticker.x * 100}%`,
    top: `${sticker.y * 100}%`,
    fontSize: `${STICKER_BASE_CQW * sticker.scale}cqw`,
    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
  } as const;

  if (!interactive) {
    return (
      <span
        className="pointer-events-none absolute z-[15] leading-none"
        style={style}
        aria-hidden>
        {sticker.assetId}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="absolute z-[15] cursor-grab touch-none leading-none active:cursor-grabbing"
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      aria-label={`${sticker.assetId} 스티커`}>
      {sticker.assetId}
    </button>
  );
}

function StrokeLayer({ strokes }: { strokes: ApiSavedCardStroke[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const parent = c.parentElement;
    if (!parent) return;

    const paint = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w < 1 || h < 1) return;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const widthScale = w / JACKET_REF_PX;
      for (const s of strokes) {
        if (s.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width * widthScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        s.points.forEach((p, i) => {
          const x = p.x * w;
          const y = p.y * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [strokes]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
    />
  );
}
