import type { ApiSavedCardCustomization } from './apiTypes';
import { DEFAULT_TEXT_COLORS } from './savedCardColors';

/** 기본 포토카드 커스터마이징 — LP 자켓 · 브랜드 웜 톤 */

export { DEFAULT_TEXT_COLORS };

export const DEFAULT_SAVED_CARD_CUSTOMIZATION: ApiSavedCardCustomization = {
  display: {
    title: true,
    artist: true,
    reason: true,
    moods: true,
    postedAt: false,
    savedAt: false,
  },
  background: '#ebe3d8',
  textColors: {
    title: '#ffffff',
    artist: '#e8dfd4',
    reason: '#ebe4da',
    moods: '#c9a66b',
    postedAt: '#a89880',
    savedAt: '#a89880',
  },
  layout: 'lp-jacket',
  frame: 'neobrutal',
  stickers: [],
};

export function buildSavedCardCustomization(
  background?: string,
): ApiSavedCardCustomization {
  return {
    ...DEFAULT_SAVED_CARD_CUSTOMIZATION,
    ...(background ? { background } : {}),
  };
}

/**
 * 자켓: background = 틴트 → 이미지 있어도 유지
 * music-strip/poster: 이미지 있으면 단색 background 제거
 */
export function prepareSavedCardCustomization(
  customization: ApiSavedCardCustomization,
): ApiSavedCardCustomization {
  const layout = customization.layout ?? 'lp-jacket';
  if (!customization.backgroundImage || layout === 'lp-jacket') {
    return customization;
  }
  const { background: _, ...rest } = customization;
  return rest;
}
