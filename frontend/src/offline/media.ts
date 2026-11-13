import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'react-native';

import { CORE_MEDIA } from './coreMedia';

/**
 * Where media files live on the device. `mediaUrl()` asks this registry first, so a photo that is
 * bundled (core objects, city covers) or downloaded (city pack) is shown from disk and everything
 * else falls back to the server URL.
 *
 *   server path:  /static/monuments/<name>.jpg   ->  documents/photos/<name>.jpg
 */
const PHOTO_PREFIX = '/static/monuments/';
const registry = new Map<string, string>();

for (const [path, asset] of Object.entries(CORE_MEDIA)) {
  const uri = Image.resolveAssetSource(asset)?.uri;
  if (uri) registry.set(path, uri);
}

export function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export const photoName = (imageUrl: string): string => imageUrl.split('/').pop() ?? imageUrl;

try {
  for (const entry of photosDir().list()) {
    if (entry instanceof File) registry.set(PHOTO_PREFIX + entry.name, entry.uri);
  }
} catch {
  // storage not readable: everything falls back to the server
}

/** Local uri for a server media path, or null when it has to be fetched. */
export function localMediaFor(path: string): string | null {
  return registry.get(path) ?? null;
}

export function registerPhoto(name: string, uri: string): void {
  registry.set(PHOTO_PREFIX + name, uri);
}

export function unregisterPhoto(name: string): void {
  const key = PHOTO_PREFIX + name;
  // Keep the bundled copy of core photos when a downloaded one is removed.
  const bundled = CORE_MEDIA[key];
  const uri = bundled !== undefined ? Image.resolveAssetSource(bundled)?.uri : undefined;
  if (uri) registry.set(key, uri);
  else registry.delete(key);
}
