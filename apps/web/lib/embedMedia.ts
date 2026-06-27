/** embed URL → 썸네일·플랫폼 (FeedCard 미리보기) */

export type SpotifyEmbedKind = 'track' | 'episode' | 'album' | 'playlist';

export type EmbedPreview =
  | { platform: 'youtube'; thumbnailUrl: string }
  | { platform: 'spotify'; thumbnailUrl: null; spotifyKind: SpotifyEmbedKind }
  | { platform: 'unknown'; thumbnailUrl: null };

export function parseSpotifyEmbedKind(
  urlString: string,
): SpotifyEmbedKind | null {
  const match = urlString.match(
    /open\.spotify\.com\/embed\/(track|album|playlist|episode)\//,
  );
  if (!match) return null;
  return match[1] as SpotifyEmbedKind;
}

/** Spotify 공식 embed 권장 높이 — 트랙은 낮고, 앨범·플레이리스트는 높음 */
export function spotifyEmbedHeight(kind: SpotifyEmbedKind): number {
  switch (kind) {
    case 'track':
    case 'episode':
      return 152;
    case 'album':
    case 'playlist':
      return 352;
  }
}

export function parseYouTubeVideoId(urlString: string): string | null {
  try {
    const url = new URL(urlString.trim());
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return id || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2] ?? null;
      }
      const watchId = url.searchParams.get('v');
      if (watchId) return watchId;
      const shortsId = url.pathname.match(/^\/shorts\/([^/?#]+)/)?.[1];
      if (shortsId) return shortsId;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getEmbedPreview(embedUrl: string): EmbedPreview {
  const videoId = parseYouTubeVideoId(embedUrl);
  if (videoId) {
    return { platform: 'youtube', thumbnailUrl: youtubeThumbnailUrl(videoId) };
  }

  if (embedUrl.includes('open.spotify.com/embed')) {
    const spotifyKind = parseSpotifyEmbedKind(embedUrl) ?? 'track';
    return { platform: 'spotify', thumbnailUrl: null, spotifyKind };
  }

  return { platform: 'unknown', thumbnailUrl: null };
}
