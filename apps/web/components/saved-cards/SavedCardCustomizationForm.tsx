'use client';

import type { ApiSavedCardCustomization } from '@/lib/apiTypes';
import { buildSavedCardCustomization } from '@/lib/savedCardDefaults';
import {
  DEFAULT_TEXT_COLORS,
  type SavedCardTextColorKey,
} from '@/lib/savedCardColors';
import { fileToBackgroundDataUrl } from '@/lib/savedCardImage';
import {
  brandPillBtnGuest,
  savedCardChip,
  savedCardFormSection,
} from '@/lib/neobrutal';
import type { JacketDecorTool } from './LpAlbumJacket';
import { Eraser, ImagePlus, Loader2, Palette, Pencil, Smile, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

const BG_PRESETS = ['#ebe3d8', '#f3ebe3', '#d4c4a8', '#3a322a', '#2a2218'];
const TEXT_PRESETS = ['#ffffff', '#ebe4da', '#171717', '#c9a66b', '#f3ebe3'];
const QUICK_EMOJIS = ['😎', '💜', '🎵', '✨', '😭', '🔥', '🥹', '✍️', '🌙', '💫'];
const DISPLAY_FIELDS = [
  { key: 'title' as const, label: '제목' },
  { key: 'artist' as const, label: '아티스트' },
  { key: 'reason' as const, label: '한줄 추천' },
  { key: 'moods' as const, label: '무드' },
  { key: 'postedAt' as const, label: '올린 날' },
  { key: 'savedAt' as const, label: '저장한 날' },
];

const DISPLAY_ON_BY_DEFAULT = new Set<(typeof DISPLAY_FIELDS)[number]['key']>([
  'title',
  'artist',
  'reason',
  'moods',
]);

const TEXT_COLOR_FIELDS: {
  key: SavedCardTextColorKey;
  label: string;
}[] = [
  { key: 'title', label: '제목' },
  { key: 'artist', label: '아티스트' },
  { key: 'reason', label: '한줄 추천' },
  { key: 'moods', label: '무드' },
  { key: 'postedAt', label: '올린 날' },
  { key: 'savedAt', label: '저장한 날' },
];

function ColorSwatches({
  value,
  presets,
  onChange,
  size = 'md',
}: {
  value: string;
  presets: string[];
  onChange: (hex: string) => void;
  size?: 'sm' | 'md';
}) {
  const swatch = size === 'sm' ? 'size-7' : 'size-9';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className={`${swatch} rounded-full border-2 transition-transform hover:scale-105 ${
            value === color
              ? 'border-brand-primary ring-2 ring-brand-primary/30'
              : 'border-white shadow-sm'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <label
        className={`${swatch} relative cursor-pointer overflow-hidden rounded-full border-2 border-neutral-200 bg-white shadow-sm`}
        aria-label="색 직접 선택">
        <Palette
          className="absolute inset-0 m-auto size-3.5 text-neutral-400"
          aria-hidden
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function isDisplayOn(
  display: ApiSavedCardCustomization['display'],
  key: (typeof DISPLAY_FIELDS)[number]['key'],
) {
  const value = display?.[key];
  if (DISPLAY_ON_BY_DEFAULT.has(key)) return value !== false;
  return value === true;
}

type SavedCardCustomizationFormProps = {
  customization: ApiSavedCardCustomization;
  setCustomization: React.Dispatch<
    React.SetStateAction<ApiSavedCardCustomization>
  >;
  defaultBackground?: string;
  onError?: (message: string) => void;
  /** 14.6++ 미리보기 연동 */
  decorTool?: JacketDecorTool;
  onDecorToolChange?: (tool: JacketDecorTool) => void;
  penColor?: string;
  onPenColorChange?: (color: string) => void;
  penWidth?: number;
  onPenWidthChange?: (width: number) => void;
};

export function SavedCardCustomizationForm({
  customization,
  setCustomization,
  defaultBackground,
  onError,
  decorTool = 'select',
  onDecorToolChange,
  penColor = '#2c2418',
  onPenColorChange,
  penWidth = 2.5,
  onPenWidthChange,
}: SavedCardCustomizationFormProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleTextColorFields = TEXT_COLOR_FIELDS.filter(({ key }) =>
    isDisplayOn(customization.display, key),
  );

  function toggleDisplay(key: (typeof DISPLAY_FIELDS)[number]['key']) {
    setCustomization((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: !isDisplayOn(prev.display, key),
      },
    }));
  }

  function setTextColor(key: SavedCardTextColorKey, color: string) {
    setCustomization((prev) => ({
      ...prev,
      textColors: { ...prev.textColors, [key]: color },
    }));
  }

  async function handleBackgroundImage(file: File) {
    setImageLoading(true);
    onError?.('');
    try {
      const dataUrl = await fileToBackgroundDataUrl(file);
      setCustomization((prev) => ({
        ...prev,
        backgroundImage: dataUrl,
        backgroundImageOpacity: prev.backgroundImageOpacity ?? 1,
        background:
          prev.background ??
          defaultBackground ??
          buildSavedCardCustomization().background,
      }));
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : '이미지를 올리지 못했어요.',
      );
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function clearBackgroundImage() {
    setCustomization((prev) => {
      const next = { ...prev };
      delete next.backgroundImage;
      delete next.backgroundImageOpacity;
      next.background =
        prev.background ??
        defaultBackground ??
        buildSavedCardCustomization().background;
      return next;
    });
  }

  function addSticker(emoji: string) {
    setCustomization((prev) => ({
      ...prev,
      stickers: [
        ...(prev.stickers ?? []),
        {
          assetId: emoji,
          x: 0.45 + Math.random() * 0.1,
          y: 0.35 + Math.random() * 0.1,
          rotation: 0,
          scale: 0.85 + Math.random() * 0.3,
        },
      ],
    }));
    setShowEmojis(false);
    onDecorToolChange?.('select');
  }

  function undoStroke() {
    setCustomization((prev) => ({
      ...prev,
      strokes: (prev.strokes ?? []).slice(0, -1),
    }));
  }

  function clearStrokes() {
    setCustomization((prev) => ({ ...prev, strokes: [] }));
  }

  function clearStickers() {
    setCustomization((prev) => ({ ...prev, stickers: [] }));
  }

  return (
    <div className="flex flex-col gap-3">
      <section className={savedCardFormSection}>
        <h3 className="text-xs font-semibold text-brand-primary">
          스티커 · 연필
        </h3>
        <p className="mt-1 text-[11px] text-neutral-500">
          미리보기 표지 위에 붙이거나 그려 주세요 · 스티커 더블탭=삭제
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showEmojis}
            onClick={() => {
              setShowEmojis((v) => !v);
              onDecorToolChange?.('select');
            }}
            className={`${savedCardChip} inline-flex items-center gap-1`}>
            <Smile className="size-3.5" aria-hidden />
            이모지
          </button>
          <button
            type="button"
            aria-pressed={decorTool === 'pen'}
            onClick={() => {
              setShowEmojis(false);
              onDecorToolChange?.(decorTool === 'pen' ? 'select' : 'pen');
            }}
            className={`${savedCardChip} inline-flex items-center gap-1`}>
            <Pencil className="size-3.5" aria-hidden />
            연필
          </button>
          <button
            type="button"
            onClick={undoStroke}
            className={`${savedCardChip} inline-flex items-center gap-1`}>
            <Eraser className="size-3.5" aria-hidden />
            되돌리기
          </button>
          <button
            type="button"
            onClick={clearStrokes}
            className={`${savedCardChip} inline-flex items-center gap-1`}>
            <Trash2 className="size-3.5" aria-hidden />
            낙서 지우기
          </button>
          {(customization.stickers?.length ?? 0) > 0 ? (
            <button
              type="button"
              onClick={clearStickers}
              className="rounded-full px-3 py-1.5 text-[11px] text-neutral-500 hover:text-red-600">
              스티커 전부 지우기
            </button>
          ) : null}
        </div>
        {showEmojis ? (
          <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white/60 p-3">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="text-2xl"
                onClick={() => addSticker(e)}>
                {e}
              </button>
            ))}
          </div>
        ) : null}
        {decorTool === 'pen' ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-neutral-600">
            <label className="flex items-center gap-2">
              색
              <input
                type="color"
                value={penColor}
                onChange={(e) => onPenColorChange?.(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              굵기
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={penWidth}
                onChange={(e) => onPenWidthChange?.(Number(e.target.value))}
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className={savedCardFormSection}>
        <h3 className="text-xs font-semibold text-brand-primary">
          표시할 내용
        </h3>
        <p className="mt-1 text-[11px] text-neutral-500">
          자켓에 보일 내용을 골라 주세요
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DISPLAY_FIELDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={isDisplayOn(customization.display, key)}
              onClick={() => toggleDisplay(key)}
              className={savedCardChip}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {visibleTextColorFields.length > 0 ? (
        <details className={savedCardFormSection} open>
          <summary className="cursor-pointer list-none text-xs font-semibold text-brand-primary [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              글자 색
              <span className="text-[10px] font-normal text-neutral-400">
                펼치기
              </span>
            </span>
          </summary>
          <div className="mt-3 space-y-3">
            {visibleTextColorFields.map(({ key, label }) => (
              <div key={key}>
                <p className="text-[11px] font-medium text-neutral-600">
                  {label}
                </p>
                <div className="mt-1.5">
                  <ColorSwatches
                    size="sm"
                    value={
                      customization.textColors?.[key] ??
                      DEFAULT_TEXT_COLORS[key]
                    }
                    presets={TEXT_PRESETS}
                    onChange={(color) => setTextColor(key, color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <section className={savedCardFormSection}>
        <h3 className="text-xs font-semibold text-brand-primary">커버</h3>
        <p className="mt-1 text-[11px] text-neutral-500">
          이미지를 안 올리면 앨범 표지가 기본이에요
        </p>
        <div className="mt-3">
          <p className="text-[11px] text-neutral-500">틴트 색 (표지 위)</p>
          <div className="mt-2">
            <ColorSwatches
              value={customization.background ?? '#ebe3d8'}
              presets={BG_PRESETS}
              onChange={(background) =>
                setCustomization((prev) => ({ ...prev, background }))
              }
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] text-neutral-500">
            커스텀 커버 · PNG·WebP 권장
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleBackgroundImage(file);
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={imageLoading}
              onClick={() => fileInputRef.current?.click()}
              className={`${brandPillBtnGuest} gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50`}>
              {imageLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-3.5" aria-hidden />
              )}
              {imageLoading ? '처리 중…' : '이미지 올리기'}
            </button>
            {customization.backgroundImage ? (
              <button
                type="button"
                onClick={clearBackgroundImage}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-red-600">
                제거
              </button>
            ) : null}
          </div>
          {customization.backgroundImage ? (
            <label className="mt-3 block">
              <span className="flex items-center justify-between text-[11px] font-medium text-neutral-600">
                투명도
                <span className="tabular-nums text-neutral-400">
                  {Math.round(
                    (customization.backgroundImageOpacity ?? 1) * 100,
                  )}
                  %
                </span>
              </span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={customization.backgroundImageOpacity ?? 1}
                onChange={(e) =>
                  setCustomization((prev) => ({
                    ...prev,
                    backgroundImageOpacity: Number(e.target.value),
                  }))
                }
                className="mt-2 w-full accent-brand-primary"
              />
            </label>
          ) : null}
        </div>
      </section>
    </div>
  );
}
