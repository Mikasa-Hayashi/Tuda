import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

/**
 * Scan history, kept on the device: the photo that was scanned, the monument the model picked and
 * how sure it was. Photos are copied out of the camera cache (the system may clear it) into the
 * app's document folder.
 */
export type ScanEntry = {
  id: string;
  /** Best match (the recognised monument, or the top candidate when the model was unsure). */
  monumentId: string;
  confidence: number;
  recognized: boolean;
  /** Local copy of the scanned photo; null when it could not be saved. */
  photoUri: string | null;
  at: number;
};

const KEY = 'scanHistory.v1';
const MAX_ENTRIES = 50;

let entries: ScanEntry[] = [];
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      entries = JSON.parse(raw) as ScanEntry[];
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

function update(next: ScanEntry[]) {
  entries = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'scans');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function savePhoto(sourceUri: string, id: string): string | null {
  try {
    const target = new File(photosDir(), `${id}.jpg`);
    new File(sourceUri).copy(target);
    return target.uri;
  } catch {
    return null;
  }
}

function deletePhoto(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The photo is gone already; nothing to clean up.
  }
}

export const scanHistory = {
  record: (input: {
    monumentId: string;
    confidence: number;
    recognized: boolean;
    photoUri?: string;
  }) => {
    const id = `${Date.now()}`;
    const entry: ScanEntry = {
      id,
      monumentId: input.monumentId,
      confidence: input.confidence,
      recognized: input.recognized,
      photoUri: input.photoUri ? savePhoto(input.photoUri, id) : null,
      at: Date.now(),
    };
    const next = [entry, ...entries];
    next.slice(MAX_ENTRIES).forEach((old) => deletePhoto(old.photoUri));
    update(next.slice(0, MAX_ENTRIES));
  },
  remove: (id: string) => {
    deletePhoto(entries.find((e) => e.id === id)?.photoUri ?? null);
    update(entries.filter((e) => e.id !== id));
  },
  clear: () => {
    entries.forEach((e) => deletePhoto(e.photoUri));
    update([]);
  },
};

export function useScanHistory(): ScanEntry[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => entries,
  );
}
