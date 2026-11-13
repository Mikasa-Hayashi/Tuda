import {
  AUDIO_LANGS,
  audioFileSize,
  deleteAudio,
  downloadAudio,
  type AudioLang,
} from '@/src/audio/audioFiles';
import { applyBundledSeed } from '@/src/db/bundledSeed';
import {
  applyDeletedFromSync,
  deleteCityData,
  getAllMonumentPreviews,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import {
  getAllRoutes,
  upsertRoutesFromSync,
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
} from '@/src/db/routeRepository';
import { downloadCityData } from '@/src/services/monumentsApi';
import { remoteMediaUrl } from '@/src/services/mediaUrl';
import {
  getDownloadedCityIds,
  markCityDownloaded,
  setDownloadedCityIds,
} from '@/src/storage/citySelection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

import { photoName, photosDir, registerPhoto, unregisterPhoto } from './media';
import { packFileSize, packQuizCount, removePack as removeQuizPack, savePack } from './quizStore';

/**
 * Per-city content packs the user can download or delete:
 *   places   – photos of every object (the texts of the core objects ship with the app and the
 *              rest of the texts arrive with the first sync, they are tiny)
 *   routes   – routes and their stops (base routes ship with the app)
 *   audio    – audio guides, per language
 *   quizzes  – the city's quizzes
 */
export type PackKind = 'places' | 'routes' | 'audio' | 'quizzes';

export type CityPacks = {
  places?: boolean;
  routes?: boolean;
  quizzes?: boolean;
  audio?: AudioLang[];
};

export type PackSelection = {
  places: boolean;
  routes: boolean;
  quizzes: boolean;
  audio: AudioLang[];
};

export type DownloadProgress = { kind: PackKind; done: number; total: number };

// ─── Saved state (reactive) ───────────────────────────────────────────────────

const KEY = 'offline.packs.v1';
let state: Record<string, CityPacks> = {};
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      state = { ...(JSON.parse(raw) as Record<string, CityPacks>), ...state };
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

function commit(next: Record<string, CityPacks>) {
  state = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

function patch(cityId: string, change: Partial<CityPacks>) {
  commit({ ...state, [cityId]: { ...state[cityId], ...change } });
}

export function usePacks(): Record<string, CityPacks> {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const hasAnyPack = (p: CityPacks | undefined): boolean =>
  !!p && (!!p.places || !!p.routes || !!p.quizzes || (p.audio?.length ?? 0) > 0);

// ─── Download ─────────────────────────────────────────────────────────────────

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Downloads the chosen packs of a city. Throws when the server cannot be reached. */
export async function downloadCityPacks(
  cityId: string,
  selection: PackSelection,
  onProgress?: (p: DownloadProgress) => void,
): Promise<void> {
  // Texts (and routes) come from one sync payload; the texts are needed by every pack.
  if (selection.places || selection.routes) {
    const payload = await downloadCityData(cityId);
    applyDeletedFromSync(payload.deleted_ids);
    upsertMonumentsFromApi(cityId, payload.monuments);
    upsertMonumentTranslationsFromApi(payload.monument_translations);
    upsertMonumentFieldConfigsFromApi(payload.monument_field_configs);
    if (selection.routes) {
      upsertRoutesFromSync(cityId, payload.routes);
      upsertRouteStopsFromSync(payload.route_stops);
      upsertRouteTranslationsFromSync(payload.route_translations);
      // A city without routes has nothing to mark as downloaded.
      if (payload.routes.length > 0) patch(cityId, { routes: true });
    }
  }

  if (selection.places) {
    const urls = [
      ...new Set(getAllMonumentPreviews('ru', cityId).map((m) => m.imageUrl).filter(Boolean)),
    ];
    let done = 0;
    onProgress?.({ kind: 'places', done, total: urls.length });
    await mapLimit(urls, 4, async (path) => {
      const name = photoName(path);
      const target = new File(photosDir(), name);
      if (!target.exists) {
        try {
          await File.downloadFileAsync(remoteMediaUrl(path), target);
        } catch {
          if (target.exists) target.delete();
        }
      }
      if (target.exists) registerPhoto(name, target.uri);
      onProgress?.({ kind: 'places', done: ++done, total: urls.length });
    });
    patch(cityId, { places: true });
    await markCityDownloaded(cityId);
  }

  if (selection.audio.length > 0) {
    const ids = getAllMonumentPreviews('ru', cityId).map((m) => m.id);
    const jobs = ids.flatMap((id) => selection.audio.map((lang) => ({ id, lang })));
    let done = 0;
    onProgress?.({ kind: 'audio', done, total: jobs.length });
    await mapLimit(jobs, 3, async ({ id, lang }) => {
      if (audioFileSize(id, lang) === null) await downloadAudio(id, lang);
      onProgress?.({ kind: 'audio', done: ++done, total: jobs.length });
    });
    const have = new Set([...(state[cityId]?.audio ?? []), ...selection.audio]);
    patch(cityId, { audio: [...have] });
  }

  if (selection.quizzes) {
    onProgress?.({ kind: 'quizzes', done: 0, total: 1 });
    const response = await fetch(remoteMediaUrl(`/static/quizzes/${cityId}.json`));
    if (response.status === 404) {
      // the city has no quiz file: nothing to download
      onProgress?.({ kind: 'quizzes', done: 1, total: 1 });
      return;
    }
    if (!response.ok) throw new Error(`quizzes ${response.status}`);
    savePack(cityId, await response.text());
    patch(cityId, { quizzes: true });
    onProgress?.({ kind: 'quizzes', done: 1, total: 1 });
  }
}

// ─── Usage (what is stored for a city) ────────────────────────────────────────

export type CityUsage = {
  monuments: number;
  routes: number;
  photos: { count: number; bytes: number };
  audio: Record<AudioLang, { count: number; bytes: number }>;
  quizzes: { count: number; bytes: number };
  totalBytes: number;
};

export function getCityUsage(cityId: string): CityUsage {
  const previews = getAllMonumentPreviews('ru', cityId);
  const photos = { count: 0, bytes: 0 };
  const names = new Set(previews.map((m) => photoName(m.imageUrl)));
  try {
    for (const name of names) {
      const file = new File(photosDir(), name);
      if (file.exists) {
        photos.count += 1;
        photos.bytes += file.size ?? 0;
      }
    }
  } catch {}
  const audio = {} as CityUsage['audio'];
  for (const lang of AUDIO_LANGS) {
    audio[lang] = { count: 0, bytes: 0 };
    for (const m of previews) {
      const size = audioFileSize(m.id, lang);
      if (size !== null) {
        audio[lang].count += 1;
        audio[lang].bytes += size;
      }
    }
  }
  const quizzes = { count: packQuizCount(cityId), bytes: packFileSize(cityId) };
  const audioBytes = AUDIO_LANGS.reduce((sum, l) => sum + audio[l].bytes, 0);
  return {
    monuments: previews.length,
    routes: getAllRoutes('ru', cityId).length,
    photos,
    audio,
    quizzes,
    totalBytes: photos.bytes + audioBytes + quizzes.bytes,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function removePhotos(cityId: string): void {
  const names = new Set(getAllMonumentPreviews('ru', cityId).map((m) => photoName(m.imageUrl)));
  for (const name of names) {
    try {
      const file = new File(photosDir(), name);
      if (file.exists) file.delete();
    } catch {}
    unregisterPhoto(name);
  }
  patch(cityId, { places: false });
}

export function removeAudio(cityId: string, lang?: AudioLang): void {
  const langs = lang ? [lang] : [...AUDIO_LANGS];
  for (const m of getAllMonumentPreviews('ru', cityId)) {
    for (const l of langs) if (audioFileSize(m.id, l) !== null) deleteAudio(m.id, l);
  }
  const left = (state[cityId]?.audio ?? []).filter((l) => !langs.includes(l));
  patch(cityId, { audio: left });
}

export function removeQuizzes(cityId: string): void {
  removeQuizPack(cityId);
  patch(cityId, { quizzes: false });
}

/** Deletes everything downloaded for the city; the bundled core objects stay. */
export async function deleteCity(cityId: string): Promise<void> {
  removeAudio(cityId);
  removePhotos(cityId);
  removeQuizzes(cityId);
  deleteCityData(cityId);
  applyBundledSeed(true);
  const { [cityId]: _gone, ...rest } = state;
  commit(rest);
  const ids = await getDownloadedCityIds();
  await setDownloadedCityIds(ids.filter((id) => id !== cityId));
}
