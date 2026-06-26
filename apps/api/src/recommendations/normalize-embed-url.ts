export function normalizeEmbedUrl(raw: string): string {
  const url = new URL(raw.trim());
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/')[2];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    const watchId = url.searchParams.get('v');
    if (watchId) return `https://www.youtube.com/embed/${watchId}`;
    const shortsId = url.pathname.match(/^\/shorts\/([^/?#]+)/)?.[1];
    if (shortsId) return `https://www.youtube.com/embed/${shortsId}`;
  }

  if (host === 'open.spotify.com' && url.pathname.startsWith('/embed/')) {
    return url.toString();
  }

  const spotify = url.pathname.match(
    /^\/(track|album|playlist|episode)\/([^/?#]+)/,
  );
  if (host === 'open.spotify.com' && spotify) {
    return `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`;
  }

  return raw.trim();
}
