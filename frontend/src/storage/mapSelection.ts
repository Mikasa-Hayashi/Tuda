import { useSyncExternalStore } from 'react';

/**
 * Which monument is selected on the map, shared between the map and its place sheet
 * (`app/place.tsx`), plus whether that sheet is currently on screen.
 */
type State = {
  selectedId: string | null;
  sheetOpen: boolean;
};

let state: State = { selectedId: null, sheetOpen: false };
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const mapSelection = {
  select: (id: string | null) => set({ selectedId: id }),
  setSheetOpen: (open: boolean) => set({ sheetOpen: open }),
  get: () => state,
};

export function useMapSelection(): State {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
  );
}
