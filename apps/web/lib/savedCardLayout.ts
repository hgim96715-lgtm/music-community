import type { ApiSavedCardCustomization } from './apiTypes';

export type SavedCardLayout = 'music-strip' | 'poster';

export function resolveSavedCardLayout(
  customization: ApiSavedCardCustomization,
): SavedCardLayout {
  return customization.layout === 'poster' ? 'poster' : 'music-strip';
}
