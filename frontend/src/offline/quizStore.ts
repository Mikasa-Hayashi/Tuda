import { Directory, File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

import seed from '../data/seed/quizzes.json';

/**
 * Quizzes available on the device: the ones bundled with the app (core objects) plus the quiz packs
 * downloaded per city (documents/quizzes/<city>.json, served by the backend from static/quizzes).
 */
export type CuratedQuestion = { question: string; options: string[]; correct: number };
export type CuratedQuiz = {
  ru: CuratedQuestion[];
  en: CuratedQuestion[];
  ar?: CuratedQuestion[];
  zh?: CuratedQuestion[];
};
type Pack = Record<string, CuratedQuiz>;

const bundled = seed as unknown as Pack;
let packs: Record<string, Pack> = {};
let merged: Pack = { ...bundled };
let version = 0;
const listeners = new Set<() => void>();

function quizzesDir(): Directory {
  const dir = new Directory(Paths.document, 'quizzes');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function rebuild() {
  merged = { ...bundled };
  for (const pack of Object.values(packs)) Object.assign(merged, pack);
  version += 1;
  listeners.forEach((l) => l());
}

// Load the downloaded packs from disk once at start-up.
(async () => {
  try {
    for (const entry of quizzesDir().list()) {
      if (!(entry instanceof File) || !entry.name.endsWith('.json')) continue;
      try {
        packs[entry.name.replace(/\.json$/, '')] = JSON.parse(await entry.text()) as Pack;
      } catch {
        // corrupt file: ignored, it can be downloaded again
      }
    }
    rebuild();
  } catch {
    // storage not readable
  }
})();

export function savePack(cityId: string, json: string): void {
  const file = new File(quizzesDir(), `${cityId}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  packs = { ...packs, [cityId]: JSON.parse(json) as Pack };
  rebuild();
}

export function removePack(cityId: string): void {
  try {
    const file = new File(quizzesDir(), `${cityId}.json`);
    if (file.exists) file.delete();
  } catch {}
  const { [cityId]: _removed, ...rest } = packs;
  packs = rest;
  rebuild();
}

export function packFileSize(cityId: string): number {
  try {
    const file = new File(quizzesDir(), `${cityId}.json`);
    return file.exists ? (file.size ?? 0) : 0;
  } catch {
    return 0;
  }
}

export const hasQuizPack = (cityId: string): boolean => cityId in packs;
export const getQuiz = (monumentId: string): CuratedQuiz | undefined => merged[monumentId];
export const getQuizMonumentIds = (): string[] => Object.keys(merged);
export const packQuizCount = (cityId: string): number => Object.keys(packs[cityId] ?? {}).length;

/** Changes whenever quizzes are added or removed, so screens can re-read them. */
export function useQuizStoreVersion(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
}
