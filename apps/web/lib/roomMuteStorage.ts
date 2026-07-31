const PREFIX = 'room-mute:';

/** localStorage 키 — user × room */
function storageKey(userId: string, roomId: string) {
  return `${PREFIX}${userId}:${roomId}`;
}

/** 이 방 알림 뮤트 여부 — 헤더·탭 soft 점 제외 · 카드 점은 흐리게 (14.8→디스코드식) */
export function isRoomMuted(userId: string, roomId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(storageKey(userId, roomId)) === '1';
}

/**
 * 알림 뮤트 on/off
 * @param muted 적용할 값 — 토글에선 보통 `next = !현재` 후 이 인자로 넘김
 */
export function setRoomMuted(
  userId: string,
  roomId: string,
  muted: boolean,
) {
  if (typeof window === 'undefined') return;
  const key = storageKey(userId, roomId);
  if (muted) localStorage.setItem(key, '1');
  else localStorage.removeItem(key);
}
