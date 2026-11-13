import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * The camera (and gallery) hand over a JPEG whose "which way is up" lives in EXIF metadata, and
 * not every consumer reads it: a photo taken with the phone turned sideways could be shown, saved
 * and sent sideways. Re-encoding bakes the rotation into the pixels, so the picture really is
 * landscape when it was shot in landscape. Falls back to the original file on any failure.
 *
 * `extraDegrees` (clockwise) additionally turns the picture: the app UI is locked to portrait, so
 * the camera always delivers a portrait frame, and a shot taken with the phone on its side has to
 * be turned by the device angle to end up upright.
 */
export async function normalizeOrientation(uri: string, extraDegrees = 0): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(uri);
    if (extraDegrees % 360 !== 0) context.rotate(extraDegrees);
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    return saved.uri;
  } catch {
    return uri;
  }
}
