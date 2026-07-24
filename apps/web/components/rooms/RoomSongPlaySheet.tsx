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
  startSec?: number;
  onSaveLyric?: () => void;
};

/** 채팅 곡 카드 재생 — 피드와 같은 YouTube/Spotify embed */
export function RoomSongPlaySheet({
  song,
  onClose,
  startSec,
  onSaveLyric,
}: RoomSongPlaySheetProps) {
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
    preview.platform === 'youtube' ? parseYouTubeVideoId(song.embedUrl) : null;

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
        className="room-sheet w-full max-w-sm overflow-hidden rounded-t-[14px] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[rgb(201_166_107/0.18)] px-4 py-3">
          <p className="truncate text-[15px] font-semibold text-[#ebe3d8]">
            {song.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-[#a89880]">
            {song.artist}
          </p>
        </div>

        <div className="bg-[rgb(22_18_15)]">
          {preview.platform === 'youtube' && youtubeBlocked && videoId ? (
            <EmbedPlaybackFallback
              thumbnailUrl={preview.thumbnailUrl}
              message="앱 안에서는 재생할 수 없어요"
              externalHref={
                startSec != null && startSec > 0
                  ? `${youtubeWatchUrl(videoId)}&t=${startSec}`
                  : youtubeWatchUrl(videoId)
              }
              externalLabel="YouTube로 열기"
              onClose={onClose}
            />
          ) : preview.platform === 'youtube' ? (
            <YouTubeFeedEmbed
              embedUrl={song.embedUrl}
              title={song.title}
              startSec={startSec ?? undefined}
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

        <>
          {onSaveLyric ? (
            <button
              type="button"
              onClick={onSaveLyric}
              className="w-full border-t border-[rgb(201_166_107/0.18)] py-3 text-[14px] font-semibold text-brand-primary">
              이 가사 저장
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full border-t border-[rgb(201_166_107/0.18)] py-3.5 text-[15px] font-semibold text-brand-primary">
            닫기
          </button>
        </>
      </div>
    </div>,
    document.body,
  );
}
