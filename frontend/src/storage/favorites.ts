import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';

export type FavoriteKind = 'monument' | 'route';

const KEYS: Record<FavoriteKind, string> = {
  monument: 'favorites.monumentIds',
  route: 'favorites.routeIds',
};

type Snapshot = { monument: readonly string[]; route: readonly string[] };

let snapshot: Snapshot = { monument: [], route: [] };
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

async function readIds(kind: FavoriteKind): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS[kind]);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

// Load once at startup; hooks update when it finishes.
Promise.all([readIds('monument'), readIds('route')])
  .then(([monument, route]) => emit({ monument, route }))
  .catch(() => {});

/** Adds or removes the item; persists, updates every subscribed component. */
export async function toggleFavorite(kind: FavoriteKind, id: string): Promise<boolean> {
  const current = snapshot[kind];
  const isFav = current.includes(id);
  const next = isFav ? current.filter((x) => x !== id) : [...current, id];
  emit({ ...snapshot, [kind]: next });
  try {
    await AsyncStorage.setItem(KEYS[kind], JSON.stringify(next));
  } catch {
    // keep the in-memory state; it will be written on the next toggle
  }
  return !isFav;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Live favorites: re-renders when anything is added or removed anywhere in the app. */
export function useFavorites() {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string) => snap[kind].includes(id),
    [snap],
  );
  return {
    monumentIds: snap.monument,
    routeIds: snap.route,
    count: snap.monument.length + snap.route.length,
    isFavorite,
    toggle: toggleFavorite,
  };
}
