import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/** The latest attempt of a monument's quiz; `passed` stays true once it has been reached. */
export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  attempts: number;
};

type Store = Record<string, QuizResult>;

/** A quiz counts as passed with at least 80 % of the answers right (4/5). */
export const PASS_RATIO = 0.8;

const KEY = 'quizProgress.v1';
let store: Store = {};
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      store = { ...(JSON.parse(raw) as Store), ...store };
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

function commit(next: Store) {
  store = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

export const quizProgress = {
  /** Saves the result of a finished attempt; returns whether this attempt passed the quiz. */
  record(monumentId: string, score: number, total: number): boolean {
    const prev = store[monumentId];
    const passedNow = total > 0 && score / total >= PASS_RATIO;
    commit({
      ...store,
      [monumentId]: {
        score,
        total,
        passed: passedNow || !!prev?.passed,
        attempts: (prev?.attempts ?? 0) + 1,
      },
    });
    return passedNow;
  },
  clear() {
    commit({});
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useQuizProgress(): Store {
  return useSyncExternalStore(subscribe, () => store);
}
