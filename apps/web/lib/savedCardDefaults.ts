import type { ApiSavedCardCustomization } from './apiTypes';
import { DEFAULT_TEXT_COLORS } from './savedCardColors';

/** 기본 포토카드 커스터마이징 — music-strip · 브랜드 소프트 톤 */

export { DEFAULT_TEXT_COLORS };

export const DEFAULT_SAVED_CARD_CUSTOMIZATION: ApiSavedCardCustomization = {
  display: {
    title: true,
    artist: true,
    reason: false,
    moods: true,
    postedAt: false,
    savedAt: false,
  },
  background: '#ebe3d8',
  playerBar: '#c9a66b',
  textColors: {
    title: '#ffffff',
    artist: '#e8dfd4',
    reason: '#3d342c',
    moods: '#6b5428',
    postedAt: '#a89880',
    savedAt: '#a89880',
  },
  layout: 'music-strip',
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

/** 이미지 배경이 있으면 단색 `background` 제거 */
export function prepareSavedCardCustomization(
  customization: ApiSavedCardCustomization,
): ApiSavedCardCustomization {
  if (!customization.backgroundImage) return customization;
  const { background: _, ...rest } = customization;
  return rest;
}
