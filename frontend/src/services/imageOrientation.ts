import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * The camera (and gallery) hand over a JPEG whose "which way is up" lives in EXIF metadata, and
 * not every consumer reads it: a photo taken with the phone turned sideways could be shown, saved
 * and sent sideways. Re-encoding bakes the rotation into the pixels, so the picture really is
 * landscape when it was shot in landscape. Falls back to the original file on any failure.
 */
export async function normalizeOrientation(uri: string): Promise<string> {
  try {
    const image = await ImageManipulator.manipulate(uri).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    return saved.uri;
  } catch {
    return uri;
  }
}
