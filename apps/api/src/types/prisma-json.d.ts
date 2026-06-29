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
    type SavedCardCustomization = {
      display?: SavedCardDisplay;
      background?: string;
      layout?: string;
      frame?: string;
      stickers?: SavedCardSticker[];
    };
  }
}
export {};
