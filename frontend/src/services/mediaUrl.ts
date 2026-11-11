const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

/** Server origin without the "/api" suffix, where static media is served. */
const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Photos are not bundled with the app: the server sends a relative path such as
 * "/static/monuments/volgograd_01.jpg", resolved here against the server origin.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('/') ? `${MEDIA_ORIGIN}${url}` : url;
}
