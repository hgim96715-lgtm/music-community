'use client';
import { EmbedPlaybackFallback } from '@/components/recommendations/EmbedPlaybackFallback';
import { YouTubeFeedEmbed } from '@/components/recommendations/YouTubeFeedEmbed';
import {
  getEmbedPreview,
  parseYouTubeVideoId,
  spotifyEmbedHeight,
  youtubeWatchUrl,
} from '@/lib/embedMedia';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RoomSongCardData } from './RoomSongCard';

type RoomSongPlaySheetProps = {
  song: RoomSongCardData | null;
  onClose: () => void;
};

/** 채팅 곡 카드 재생 — 피드와 같은 YouTube/Spotify embed */
export function RoomSongPlaySheet({ song, onClose }: RoomSongPlaySheetProps) {
  const [mounted, setMounted] = useState(false);
  const [youtubeBlocked, setYoutubeBlocked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setYoutubeBlocked(false);
  }, [song?.embedUrl]);

  useEffect(() => {
    if (!song) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [song, onClose]);

  if (!song || !mounted) return null;

  const preview = getEmbedPreview(song.embedUrl);
  const videoId =
    preview.platform === 'youtube'
      ? parseYouTubeVideoId(song.embedUrl)
      : null;

  const iframeAllow =
    preview.platform === 'youtube'
      ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      : 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${song.title} 재생`}
      onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-[14px] bg-[#f3ebe3] shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[rgb(31_26_22/0.1)] px-4 py-3">
          <p className="truncate text-[15px] font-semibold text-[#1a1410]">
            {song.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-[#6b5c4c]">
            {song.artist}
          </p>
        </div>

        <div className="bg-[#ebe3d8]">
          {preview.platform === 'youtube' && youtubeBlocked && videoId ? (
            <EmbedPlaybackFallback
              thumbnailUrl={preview.thumbnailUrl}
              message="앱 안에서는 재생할 수 없어요"
              externalHref={youtubeWatchUrl(videoId)}
              externalLabel="YouTube로 열기"
              onClose={onClose}
            />
          ) : preview.platform === 'youtube' ? (
            <YouTubeFeedEmbed
              embedUrl={song.embedUrl}
              title={song.title}
              onEmbedBlocked={() => setYoutubeBlocked(true)}
            />
          ) : preview.platform === 'spotify' ? (
            <iframe
              src={song.embedUrl}
              title={song.title}
              className="w-full border-0"
              style={{ height: spotifyEmbedHeight(preview.spotifyKind) }}
              allow={iframeAllow}
              loading="lazy"
            />
          ) : (
            <div className="aspect-video w-full">
              <iframe
                src={song.embedUrl}
                title={song.title}
                className="h-full w-full border-0"
                allow={iframeAllow}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full border-t border-[rgb(31_26_22/0.1)] py-3.5 text-[15px] font-semibold text-[#6b5428]">
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
}
