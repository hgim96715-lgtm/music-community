const PREFIX = 'room-notice-seen:';

function storageKey(userId: string, roomId: string) {
  return `${PREFIX}${userId}:${roomId}`;
}

/** 마지막으로 본 공지 본문 (description) */
export function getSeenNoticeText(
  userId: string,
  roomId: string,
): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(storageKey(userId, roomId));
}

export function markNoticeSeen(
  userId: string,
  roomId: string,
  description: string | null,
) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId, roomId), description?.trim() ?? '');
}

/** 공지 본문이 바뀌었으면 soft 점 */
export function hasUnreadNotice(
  userId: string,
  roomId: string,
  description: string | null,
): boolean {
  const body = description?.trim() ?? '';
  if (!body) return false;
  return getSeenNoticeText(userId, roomId) !== body;
}
