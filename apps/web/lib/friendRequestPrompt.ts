/** 받은 친구 요청 모달 — sessionStorage에 이미 본 friendship id를 남겨, 같은 세션에서 모달이 또 뜨지 않게 함 */

const SEEN_KEY = 'mc_seen_friend_request_ids';

function readSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

/** Set → JSON 배열 문자열로 sessionStorage에 저장 */
function writeSeenIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

/** 받은 요청 중 아직 모달로 안 본 friendship id */
export function getUnseenFriendRequestIds(receivedIds: string[]): string[] {
  const seen = readSeenIds();
  return receivedIds.filter((id) => !seen.has(id));
}

/** 모달 닫기/요청 보기 후 — 본 것으로 기록 (같은 세션에서 또 안 뜸) */
export function markFriendRequestIdsSeen(ids: string[]) {
  if (ids.length === 0) return;
  const seen = readSeenIds();
  for (const id of ids) seen.add(id);
  writeSeenIds(seen);
}
