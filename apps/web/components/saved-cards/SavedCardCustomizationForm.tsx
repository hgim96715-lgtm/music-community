'use client';

import type { ApiSavedCardCustomization } from '@/lib/apiTypes';
import { buildSavedCardCustomization } from '@/lib/savedCardDefaults';
import {
  DEFAULT_TEXT_COLORS,
  getSavedCardPlayerBarColor,
  type SavedCardTextColorKey,
} from '@/lib/savedCardColors';
import { fileToBackgroundDataUrl } from '@/lib/savedCardImage';
import { resolveSavedCardLayout } from '@/lib/savedCardLayout';
import {
  brandPillBtnGuest,
  savedCardChip,
  savedCardFormSection,
} from '@/lib/neobrutal';
import { ImagePlus, Loader2, Palette } from 'lucide-react';
import { useRef, useState } from 'react';

const BG_PRESETS = ['#ebe3d8', '#f3ebe3', '#d4c4a8', '#3a322a', '#2a2218'];
const PLAYER_BAR_PRESETS = [
  '#c9a66b',
  '#8a7048',
  '#6b5428',
  '#1a1410',
  '#5a4636',
];
const TEXT_PRESETS = ['#ffffff', '#ebe4da', '#171717', '#c9a66b', '#f3ebe3'];

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
};

export function SavedCardCustomizationForm({
  customization,
  setCustomization,
  defaultBackground,
  onError,
}: SavedCardCustomizationFormProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleTextColorFields = TEXT_COLOR_FIELDS.filter(({ key }) =>
    isDisplayOn(customization.display, key),
  );
  const isMusicStrip =
    resolveSavedCardLayout(customization) === 'music-strip';

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
      setCustomization((prev) => {
        const next = {
          ...prev,
          backgroundImage: dataUrl,
          backgroundImageOpacity: prev.backgroundImageOpacity ?? 1,
        };
        delete next.background;
        return next;
      });
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

  return (
    <div className="flex flex-col gap-3">
      <section className={savedCardFormSection}>
        <h3 className="text-xs font-semibold text-brand-primary">표시할 내용</h3>
        <p className="mt-1 text-[11px] text-neutral-500">
          켠 항목만 카드에 보여요
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
                      customization.textColors?.[key] ?? DEFAULT_TEXT_COLORS[key]
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
        <h3 className="text-xs font-semibold text-brand-primary">배경</h3>
        {!customization.backgroundImage ? (
          <div className="mt-3">
            <p className="text-[11px] text-neutral-500">
              {isMusicStrip ? '가운데 배경 색' : '배경 색'}
            </p>
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
        ) : null}

        {isMusicStrip ? (
          <div className={customization.backgroundImage ? 'mt-3' : 'mt-4'}>
            <p className="text-[11px] text-neutral-500">플레이어 바 색</p>
            <div className="mt-2">
              <ColorSwatches
                value={getSavedCardPlayerBarColor(customization)}
                presets={PLAYER_BAR_PRESETS}
                onChange={(playerBar) =>
                  setCustomization((prev) => ({ ...prev, playerBar }))
                }
              />
            </div>
          </div>
        ) : null}

        <div className={customization.backgroundImage ? '' : 'mt-4'}>
          <p className="text-[11px] text-neutral-500">
            배경 이미지 · PNG·WebP 권장
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
                  {Math.round((customization.backgroundImageOpacity ?? 1) * 100)}%
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
