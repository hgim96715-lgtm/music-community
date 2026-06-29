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
  background: '#e4eff5',
  playerBar: '#335b73',
  textColors: {
    title: '#ffffff',
    artist: '#e2e8f0',
    reason: '#475569',
    moods: '#335b73',
    postedAt: '#94a3b8',
    savedAt: '#94a3b8',
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
