import { localMediaFor } from '@/src/offline/media';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

/** Server origin without the "/api" suffix, where static media is served. */
const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Server URL of a media path (never the local copy). */
export function remoteMediaUrl(url: string): string {
  return url.startsWith('/') ? `${MEDIA_ORIGIN}${url}` : url;
}

/**
 * Media are mostly not bundled: the server sends a relative path such as
 * "/static/monuments/volgograd_01.jpg". Bundled photos (core objects, city covers) and photos from
 * downloaded city packs are served from disk (see src/offline/media.ts); the rest from the server.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  return localMediaFor(url) ?? remoteMediaUrl(url);
}
