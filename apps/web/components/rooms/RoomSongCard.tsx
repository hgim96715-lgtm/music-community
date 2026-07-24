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
  'flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.9)] px-2.5 py-2 text-left shadow-[0_2px_8px_rgb(0_0_0/0.28)]';

/** 방 채팅 · Now Playing용 곡 strip */
export function RoomSongCard({ song, onPlay }: RoomSongCardProps) {
  const body = (
    <>
      <LpAlbumDisc embedUrl={song.embedUrl} title={song.title} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#ebe3d8]">
          {song.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[#a89880]">
          {song.artist}
        </span>
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(26_22_18/0.65)] text-brand-primary">
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
