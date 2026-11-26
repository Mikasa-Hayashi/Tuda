import { Directory, File, Paths } from 'expo-file-system';
import type { ScanRecord } from './personalDataTypes';

function photoFile(id: string): File {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new Error('Invalid scan ID');
  return new File(Paths.document, 'scans', `${id}.jpg`);
}

export function saveScanPhoto(sourceUri: string, id: string) {
  try {
    const dir = new Directory(Paths.document, 'scans');
    if (!dir.exists) dir.create({ intermediates: true });
    new File(sourceUri).copy(photoFile(id));
  } catch {
    // The history entry is still usable without a photo.
  }
}

export function scanPhotoUri(id: string): string | null {
  try {
    const file = photoFile(id);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

export function deleteScanPhotos(entries: readonly ScanRecord[]) {
  entries.forEach(({ id }) => {
    try {
      const file = photoFile(id);
      if (file.exists) file.delete();
    } catch {
      // The history can be removed even if the file is unavailable.
    }
  });
}
