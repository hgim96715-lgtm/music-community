/** embed URL → 썸네일·플랫폼 (FeedCard 미리보기) */

export type SpotifyEmbedKind = 'track' | 'episode' | 'album' | 'playlist';

export type EmbedPreview =
  | { platform: 'youtube'; thumbnailUrl: string }
  | { platform: 'spotify'; thumbnailUrl: null; spotifyKind: SpotifyEmbedKind }
  | { platform: 'unknown'; thumbnailUrl: null };

const SPOTIFY_EMBED_PATH =
  /open\.spotify\.com\/embed\/(track|album|playlist|episode)\/([^/?#]+)/;

export function parseSpotifyEmbedKind(
  urlString: string,
): SpotifyEmbedKind | null {
  const match = urlString.match(SPOTIFY_EMBED_PATH);
  if (!match) return null;
  return match[1] as SpotifyEmbedKind;
}

/** embed URL → oEmbed용 open.spotify.com 리소스 URL */
export function spotifyResourceUrlFromEmbed(embedUrl: string): string | null {
  const match = embedUrl.match(SPOTIFY_EMBED_PATH);
  if (!match) return null;
  return `https://open.spotify.com/${match[1]}/${match[2]}`;
}

const spotifyThumbCache = new Map<string, Promise<string | null>>();

/** Spotify oEmbed → thumbnail_url (브라우저 CORS OK) */
export function fetchSpotifyThumbnailUrl(
  embedUrl: string,
): Promise<string | null> {
  const cached = spotifyThumbCache.get(embedUrl);
  if (cached) return cached;

  const promise = (async () => {
    const resourceUrl = spotifyResourceUrlFromEmbed(embedUrl);
    if (!resourceUrl) return null;
    try {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(resourceUrl)}`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { thumbnail_url?: string };
      return typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null;
    } catch {
      return null;
    }
  })();

  spotifyThumbCache.set(embedUrl, promise);
  return promise;
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

//
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

//Google YouTube IFrame Player API 공식 문서의 onError 코드
export function isYouTubeEmbedBlockedError(code: number): boolean {
  return code === 101 || code === 150;
}
