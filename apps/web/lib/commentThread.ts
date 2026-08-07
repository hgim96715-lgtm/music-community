import type { ApiComment } from './api/apiTypes';

/** UI 들여쓰기 상한 — 깊이는 무한, 밀기는 여기까지만 */
export const REPLY_INDENT_CAP = 2;

/** 루트당 기본으로 보여줄 답글 수 (접힌 상태) */
export const REPLY_PREVIEW_COUNT = 1;

export function commentDepth(list: ApiComment[], id: string): number {
  const byId = new Map(list.map((c) => [c.id, c]));
  let depth = 0;
  let current = byId.get(id);
  const seen = new Set<string>();
  while (current?.parentId && depth < 32) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    depth += 1;
    current = byId.get(current.parentId);
  }
  return depth;
}

/** parentId를 따라 루트 댓글 id */
export function commentRootId(list: ApiComment[], id: string): string {
  const byId = new Map(list.map((c) => [c.id, c]));
  let current = byId.get(id);
  const seen = new Set<string>();
  while (current?.parentId) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.id ?? id;
}

/** 루트 최신순 · 자식은 부모 직후 오래된순 (DFS) */
export function flattenCommentThread(list: ApiComment[]): ApiComment[] {
  const byParent = new Map<string | null, ApiComment[]>();

  for (const c of list) {
    const key = c.parentId;
    const bucket = byParent.get(key) ?? [];
    bucket.push(c);
    byParent.set(key, bucket);
  }

  for (const [, bucket] of byParent) {
    bucket.sort(
      (a, b) =>
        a.parentId === null
          ? b.createdAt.localeCompare(a.createdAt) // 루트: 최신 먼저
          : a.createdAt.localeCompare(b.createdAt), // 답글: 오래된 먼저
    );
  }

  const out: ApiComment[] = [];
  const walk = (parentId: string | null) => {
    for (const c of byParent.get(parentId) ?? []) {
      out.push(c);
      walk(c.id);
    }
  };

  walk(null);
  return out;
}

export function threadSlice(flat: ApiComment[], rootId: string): ApiComment[] {
  const start = flat.findIndex((c) => c.id === rootId);
  if (start < 0) return [];
  const slice: ApiComment[] = [flat[start]];
  for (let i = start + 1; i < flat.length; i++) {
    if (commentDepth(flat, flat[i].id) === 0) break;
    slice.push(flat[i]);
  }
  return slice;
}

export function visibleCommentIds(
  flat: ApiComment[],
  expandedRootIds: ReadonlySet<string>,
): Set<string> {
  const visible = new Set<string>();
  for (const c of flat) {
    if (commentDepth(flat, c.id) !== 0) continue;
    const thread = threadSlice(flat, c.id);
    const replies = thread.slice(1);
    if (expandedRootIds.has(c.id) || replies.length <= REPLY_PREVIEW_COUNT) {
      for (const t of thread) visible.add(t.id);
    } else {
      visible.add(c.id);
      for (const r of replies.slice(0, REPLY_PREVIEW_COUNT)) visible.add(r.id);
    }
  }
  return visible;
}
