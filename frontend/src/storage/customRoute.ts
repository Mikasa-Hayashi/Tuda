import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';

/** The user's own route: monument ids in visiting order, built from the map and the AI route. */
const KEY = 'customRoute.monumentIds';

let snapshot: readonly string[] = [];
const listeners = new Set<() => void>();

function emit(next: readonly string[]) {
  snapshot = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

AsyncStorage.getItem(KEY)
  .then((raw) => {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      snapshot = parsed.filter((x): x is string => typeof x === 'string');
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

export function toggleCustomRouteStop(id: string): boolean {
  const has = snapshot.includes(id);
  emit(has ? snapshot.filter((x) => x !== id) : [...snapshot, id]);
  return !has;
}

export function setCustomRoute(ids: string[]) {
  emit(ids);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCustomRoute() {
  const ids = useSyncExternalStore(subscribe, () => snapshot);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, has, toggle: toggleCustomRouteStop, set: setCustomRoute };
}
