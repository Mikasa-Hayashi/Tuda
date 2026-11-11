import { useSyncExternalStore } from 'react';

/** The route currently followed on the map (session only), shared by the map and route pages. */
let activeId: string | null = null;
const listeners = new Set<() => void>();

export const activeRoute = {
  set: (id: string | null) => {
    activeId = id;
    listeners.forEach((l) => l());
  },
  get: () => activeId,
};

export function useActiveRouteId(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => activeId,
  );
}
