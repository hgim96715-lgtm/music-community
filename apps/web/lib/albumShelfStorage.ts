/** 마이 앨범 Top 3 — API `shelfRank` 전까지 로컬 저장 */

export type ShelfRank = 1 | 2 | 3;

const STORAGE_KEY = 'mc:album-shelf-ranks';

export function loadShelfRanks(): Record<string, ShelfRank> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, ShelfRank> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (value === 1 || value === 2 || value === 3) out[id] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveShelfRanks(ranks: Record<string, ShelfRank>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ranks));
}

/** 빈 자리 중 가장 앞 (#1→#2→#3) */
export function firstEmptyShelfRank(
  ranks: Record<string, ShelfRank>,
): ShelfRank | null {
  const used = new Set(Object.values(ranks));
  for (const rank of [1, 2, 3] as const) {
    if (!used.has(rank)) return rank;
  }
  return null;
}

export function cardIdAtRank(
  ranks: Record<string, ShelfRank>,
  rank: ShelfRank,
): string | null {
  for (const [id, value] of Object.entries(ranks)) {
    if (value === rank) return id;
  }
  return null;
}
