import { getAllMonumentPreviews } from '@/src/db/monumentRepository';
import { Image } from 'expo-image';

/**
 * Downloads a city's photos into the image disk cache so they show without a connection.
 * Already cached images are skipped by expo-image; failures are ignored (no network).
 */
export async function prefetchCityImages(cityId: string): Promise<void> {
  const urls = getAllMonumentPreviews('ru', cityId)
    .map((m) => m.imageUrl)
    .filter((u) => u.startsWith('http'));
  if (urls.length === 0) return;
  try {
    await Image.prefetch(urls, 'disk');
  } catch {
    // offline: the photos are fetched on demand later
  }
}
