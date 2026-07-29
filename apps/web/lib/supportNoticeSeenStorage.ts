const PREFIX = 'support-notice-seen:';

function storageKey(userId: string) {
  return `${PREFIX}${userId}`;
}

export function getSupportNoticeSeenAt(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(storageKey(userId));
}

export function markSupportNoticesSeen(userId: string, publishedAt: string) {
  if (typeof window === 'undefined') return;
  const at = publishedAt.trim();
  if (!at) return;
  const prev = getSupportNoticeSeenAt(userId);
  if (prev && new Date(prev).getTime() >= new Date(at).getTime()) return;
  localStorage.setItem(storageKey(userId), at);
}

export function hasUnseenSupportNotice(
  userId: string,
  notices: { publishedAt: string | null }[],
): boolean {
  if (typeof window === 'undefined') return false;
  const seen = getSupportNoticeSeenAt(userId);
  const seenMs = seen ? new Date(seen).getTime() : 0;
  return notices.some((n) => {
    const at = n.publishedAt?.trim();
    if (!at) return false;
    return new Date(at).getTime() > seenMs;
  });
}
