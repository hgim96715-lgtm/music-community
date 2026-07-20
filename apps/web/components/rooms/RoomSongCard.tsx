'use client';
import { LpAlbumDisc } from '@/components/saved-cards/LpAlbumDisc';
import { Play } from 'lucide-react';

export type RoomSongCardData = {
  title: string;
  artist: string;
  embedUrl: string;
};

type RoomSongCardProps = {
  song: RoomSongCardData;
  onPlay?: () => void;
};

const cardClassName =
  'flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[rgb(31_26_22/0.12)] bg-[#ebe3d8] px-2.5 py-2 text-left shadow-[0_1px_2px_rgb(31_26_22/0.06)]';

/** 방 채팅 · Now Playing용 곡 strip */
export function RoomSongCard({ song, onPlay }: RoomSongCardProps) {
  const body = (
    <>
      <LpAlbumDisc embedUrl={song.embedUrl} title={song.title} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#1a1410]">
          {song.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[#6b5c4c]">
          {song.artist}
        </span>
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[rgb(31_26_22/0.16)] bg-[#f7f1e8] text-[#6b5428]">
        <Play className="size-3.5 fill-current" aria-hidden />
      </span>
      <span className="sr-only">
        {song.title} · {song.artist} 재생
      </span>
    </>
  );

  if (onPlay) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className={cardClassName}>
        {body}
      </button>
    );
  }

  return <div className={cardClassName}>{body}</div>;
}
