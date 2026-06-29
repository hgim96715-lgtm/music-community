declare global {
  namespace PrismaJson {
    type SavedCardDisplay = {
      title?: boolean;
      artist?: boolean;
      reason?: boolean;
      moods?: boolean;
      postedAt?: boolean;
      savedAt?: boolean;
    };
    type SavedCardSticker = {
      assetId: string;
      x: number;
      y: number;
      rotation: number;
      scale: number;
    };
    type SavedCardTextColors = {
      title?: string;
      artist?: string;
      reason?: string;
      moods?: string;
      postedAt?: string;
      savedAt?: string;
    };
    type SavedCardCustomization = {
      display?: SavedCardDisplay;
      background?: string;
      backgroundImage?: string;
      backgroundImageOpacity?: number;
      layout?: string;
      frame?: string;
      playerBar?: string;
      /** @deprecated `textColors` 사용 */
      textColor?: string;
      textColors?: SavedCardTextColors;
      stickers?: SavedCardSticker[];
    };
  }
}
export {};
