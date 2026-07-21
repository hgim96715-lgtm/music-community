import type { ApiSavedCardCustomization } from './apiTypes';

export type SavedCardLayout = 'lp-jacket' | 'music-strip' | 'poster';

/** 기본·신규 = 자켓. 예전 music-strip/poster 데이터는 유지 */
export function resolveSavedCardLayout(
  customization: ApiSavedCardCustomization,
): SavedCardLayout {
  if (customization.layout === 'poster') return 'poster';
  if (customization.layout === 'music-strip') return 'music-strip';
  return 'lp-jacket';
}
