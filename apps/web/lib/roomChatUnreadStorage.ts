const PREFIX = 'room-chat-seen:';

function storageKey(userId: string, roomId: string) {
  return `${PREFIX}:${userId}:${roomId}`;
}

/** 마지막으로 본 메시지 시각 (ISO) */
export function getSeenChatAt(userId: string, roomId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(storageKey(userId, roomId));
}

/** 입장·채팅 화면에서 읽음 — lastMessageAt(ISO) 저장 */
export function markChatSeen(
  userId: string,
  roomId: string,
  lastMessageAt: string,
) {
  if (typeof window === 'undefined') return;
  const at = lastMessageAt?.trim();
  if (!at) {
    localStorage.setItem(storageKey(userId, roomId), '');
    return;
  }
  localStorage.setItem(storageKey(userId, roomId), at);
}

/**
 * 내 방 soft 점 — lastMessageAt이 마지막으로 본 시각보다 뒤면 unread
 * (공지 `hasUnreadNotice`와 키·로직 완전 분리)
 */
export function hasUnreadChat(
  userId: string,
  roomId: string,
  lastMessageAt: string | null,
): boolean {
  const latest = lastMessageAt?.trim();
  if (!latest) return false;
  const seen = getSeenChatAt(userId, roomId);
  if (!seen) return true;
  return new Date(latest).getTime() > new Date(seen).getTime();
}
