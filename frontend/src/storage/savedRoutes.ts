import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/** Routes the user built (AI route builder) and chose to keep, so they need not be rebuilt. */
export type SavedRoute = {
  id: string;
  name: string;
  monumentIds: string[];
  summary: string;
  time: 'couple' | 'half' | 'full';
  age: 'kids' | 'adults' | 'family';
  createdAt: number;
};

const KEY = 'savedRoutes.v1';

let routes: readonly SavedRoute[] = [];
const listeners = new Set<() => void>();

function update(next: readonly SavedRoute[]) {
  routes = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

AsyncStorage.getItem(KEY)
  .then((raw) => {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      routes = parsed as SavedRoute[];
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

export const savedRoutes = {
  add: (input: Omit<SavedRoute, 'id' | 'createdAt'>) =>
    update([{ ...input, id: `${Date.now()}`, createdAt: Date.now() }, ...routes]),
  remove: (id: string) => update(routes.filter((r) => r.id !== id)),
};

export function useSavedRoutes(): readonly SavedRoute[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => routes,
  );
}
