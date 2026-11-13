import { mediaUrl } from '@/src/services/mediaUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

/**
 * Audio-guide files. By default a guide streams from the server; "Download" saves the mp3 in the
 * app's document folder so it plays offline (the player prefers the local copy when it exists).
 * Files are named `<monumentId>_<lang>.mp3` on the server (static/audio/).
 */
const SUPPORTED = ['ru', 'en', 'ar', 'zh'] as const;
export type AudioLang = (typeof SUPPORTED)[number];

export function audioLang(language: string): AudioLang {
  const base = language.split('-')[0] as AudioLang;
  return SUPPORTED.includes(base) ? base : 'en';
}

const fileName = (monumentId: string, lang: AudioLang) => `${monumentId}_${lang}.mp3`;

export function remoteAudioUrl(monumentId: string, lang: AudioLang): string {
  return mediaUrl(`/static/audio/${fileName(monumentId, lang)}`);
}

function audioDir(): Directory {
  const dir = new Directory(Paths.document, 'audio');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

// ─── Downloaded set (reactive) ────────────────────────────────────────────────

const KEY = 'audioGuide.downloaded.v1';
let downloaded = new Set<string>();
let downloading = new Set<string>();
let snapshot = { downloaded, downloading };
const listeners = new Set<() => void>();

function emit() {
  snapshot = { downloaded, downloading };
  listeners.forEach((l) => l());
}

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    // Keep only entries whose file is still there (the system may purge storage).
    const names = (JSON.parse(raw) as string[]).filter((n) => {
      try {
        return new File(audioDir(), n).exists;
      } catch {
        return false;
      }
    });
    downloaded = new Set(names);
    emit();
  })
  .catch(() => {});

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify([...downloaded])).catch(() => {});
}

export function localAudioUri(monumentId: string, lang: AudioLang): string | null {
  const name = fileName(monumentId, lang);
  if (!downloaded.has(name)) return null;
  const file = new File(audioDir(), name);
  return file.exists ? file.uri : null;
}

/** Local file if downloaded, otherwise the server URL. */
export function audioSource(monumentId: string, lang: AudioLang): string {
  return localAudioUri(monumentId, lang) ?? remoteAudioUrl(monumentId, lang);
}

export async function downloadAudio(monumentId: string, lang: AudioLang): Promise<boolean> {
  const name = fileName(monumentId, lang);
  if (downloading.has(name)) return false;
  downloading = new Set(downloading).add(name);
  emit();
  try {
    const target = new File(audioDir(), name);
    if (target.exists) target.delete();
    await File.downloadFileAsync(remoteAudioUrl(monumentId, lang), target);
    downloaded = new Set(downloaded).add(name);
    persist();
    return true;
  } catch {
    try {
      const partial = new File(audioDir(), name);
      if (partial.exists) partial.delete();
    } catch {}
    return false;
  } finally {
    downloading = new Set(downloading);
    downloading.delete(name);
    emit();
  }
}

export function deleteAudio(monumentId: string, lang: AudioLang): void {
  const name = fileName(monumentId, lang);
  try {
    const file = new File(audioDir(), name);
    if (file.exists) file.delete();
  } catch {}
  downloaded = new Set(downloaded);
  downloaded.delete(name);
  persist();
  emit();
}

export type AudioDownloadState = 'none' | 'downloading' | 'downloaded';

export function useAudioDownloadState(monumentId: string, lang: AudioLang): AudioDownloadState {
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
  const name = fileName(monumentId, lang);
  if (snap.downloading.has(name)) return 'downloading';
  return snap.downloaded.has(name) ? 'downloaded' : 'none';
}
