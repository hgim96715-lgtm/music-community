const PREFIX = 'room-chat-theme:';

export const ROOM_THEME_PRESET_IDS = [
  'lp-bar',
  'cream-paper',
  'midnight',
  'fan-pink',
] as const;

export type RoomThemePresetId = (typeof ROOM_THEME_PRESET_IDS)[number];

export type RoomThemePrefs = {
  presetId: RoomThemePresetId;
  backgroundUrl: string | null;
};

function storageKey(value: string, roomId: string) {
  return `${PREFIX}${value}:${roomId}`;
}

function isPresetId(value: string): value is RoomThemePresetId {
  return (ROOM_THEME_PRESET_IDS as readonly string[]).includes(value);
}

function defaultPrefs(): RoomThemePrefs {
  return {
    presetId: 'lp-bar',
    backgroundUrl: null,
  };
}

export function getRoomThemePrefs(
  userId: string,
  roomId: string,
): RoomThemePrefs {
  if (typeof window === 'undefined') return defaultPrefs();
  const raw = localStorage.getItem(storageKey(userId, roomId));
  if (!raw) return defaultPrefs();

  if (isPresetId(raw)) {
    return { presetId: raw, backgroundUrl: null };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<RoomThemePrefs>;
    const presetId = isPresetId(parsed.presetId ?? '')
      ? parsed.presetId!
      : 'lp-bar';
    const backgroundUrl =
      typeof parsed.backgroundUrl === 'string' &&
      parsed.backgroundUrl.trim() !== ''
        ? parsed.backgroundUrl.trim()
        : null;
    return { presetId, backgroundUrl };
  } catch {
    return defaultPrefs();
  }
}

export function getRoomThemePreset(
  userId: string,
  roomId: string,
): RoomThemePresetId {
  return getRoomThemePrefs(userId, roomId).presetId;
}

export function setRoomThemePrefs(
  userId: string,
  roomId: string,
  prefs: RoomThemePrefs,
) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId, roomId), JSON.stringify(prefs));
  } catch {
    // QuotaExceeded — 큰 data URL 등
    throw new Error(
      '저장 공간이 부족해요. 더 작은 이미지이거나 URL을 써 주세요.',
    );
  }
}

export function setRoomThemePreset(
  userId: string,
  roomId: string,
  presetId: RoomThemePresetId,
) {
  const prev = getRoomThemePrefs(userId, roomId);
  setRoomThemePrefs(userId, roomId, { ...prev, presetId });
}

export function setRoomThemeBackgroundUrl(
  userId: string,
  roomId: string,
  backgroundUrl: string | null,
) {
  const prev = getRoomThemePrefs(userId, roomId);
  setRoomThemePrefs(userId, roomId, {
    ...prev,
    backgroundUrl: backgroundUrl?.trim() || null,
  });
}
