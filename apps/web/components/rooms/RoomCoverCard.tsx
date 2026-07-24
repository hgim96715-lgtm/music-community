'use client';

import { MoodNapkin } from '@/components/recommendations/MoodNapkin';
import type { ApiRoom } from '@/lib/rooms';
import { LockIcon } from 'lucide-react';
import Link from 'next/link';

type RoomCoverCardProps = {
  room: ApiRoom;
  /** 「내 방」만 soft 점 */
  unread?: boolean;
};

function roomInitial(room: ApiRoom) {
  const raw = room.name.trim().charAt(0);
  return raw || '♪';
}

/**
 * `/rooms` LP 진열 1칸 — 방 = 앨범 한 장
 * 커버 URL 없음 → 비닐 + 종이 라벨(이니셜 각인)
 * 태그 = # ❌ · 무드와 같은 손글씨
 */
export function RoomCoverCard({ room, unread = false }: RoomCoverCardProps) {
  const tags = room.topicTags
    .slice(0, 2)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
  const description = room.description?.trim() || null;
  const initial = roomInitial(room);

  return (
    <li>
      <Link
        href={`/rooms/${room.id}`}
        className="group flex flex-col items-center gap-2.5 rounded-xl px-1 py-2 transition-colors active:scale-[0.98]">
        <span className="relative inline-flex">
          <span
            className="lp-album-disc room-lp-disc size-[5.25rem] transition-transform duration-500 group-hover:rotate-[18deg] motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
            aria-hidden>
            <span className="room-lp-label">{initial}</span>
            <span className="lp-album-disc-label" />
          </span>
          {room.visibility === 'private' ? (
            <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-6 items-center justify-center rounded-full bg-[rgb(20_17_14/0.82)] text-[color:var(--color-lp-paper)] shadow-[0_1px_3px_rgba(0,0,0,0.35)] ring-2 ring-[color:var(--color-brand-bg)]">
              <LockIcon className="size-3" aria-label="비공개" />
            </span>
          ) : null}
          {unread ? (
            <span
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand-primary ring-2 ring-[color:var(--color-brand-bg)]"
              aria-hidden
            />
          ) : null}
        </span>
        <span className="flex w-full min-w-0 flex-col items-center gap-0.5 px-0.5 text-center">
          <span className="w-full truncate text-[13px] font-semibold tracking-tight text-[color:var(--color-lp-paper)]">
            {room.name}
          </span>
          <span className="w-full truncate text-[11px] leading-snug text-[color:var(--color-lp-muted)]">
            {room.memberCount}명
          </span>
          {tags.length > 0 ? (
            <MoodNapkin moods={tags} size="room" className="mt-0.5 max-w-full" />
          ) : description ? (
            <span className="mt-0.5 w-full truncate text-[11px] leading-snug text-[color:var(--color-lp-muted)]">
              {description}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
