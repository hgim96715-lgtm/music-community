import type { ApiSavedCardCustomization } from './apiTypes';

export const DEFAULT_TEXT_COLORS = {
  title: '#171717',
  artist: '#525252',
  reason: '#404040',
  moods: '#737373',
  postedAt: '#737373',
  savedAt: '#737373',
} as const;

export type SavedCardTextColorKey = keyof typeof DEFAULT_TEXT_COLORS;

export function getSavedCardTextColor(
  customization: ApiSavedCardCustomization,
  key: SavedCardTextColorKey,
): string {
  return customization.textColors?.[key] ?? DEFAULT_TEXT_COLORS[key];
}

const DEFAULT_PLAYER_BAR = '#c9a66b';

/** music-strip 플레이어 바 반투명 오버레이 */
export const PLAYER_BAR_ALPHA = 0.72;

export function getSavedCardPlayerBarColor(
  customization: ApiSavedCardCustomization,
): string {
  return customization.playerBar ?? DEFAULT_PLAYER_BAR;
}

/** `#rrggbb` → `rgba(r,g,b,a)` — music-strip 플레이어 바 반투명용 */
export function withHexAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return hex;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
