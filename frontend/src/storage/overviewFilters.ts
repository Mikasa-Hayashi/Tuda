import { useSyncExternalStore } from 'react';

/** Tags chosen in the Overview filter sheet (shared between the sheet and the list). */
let selected: string[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const overviewFilters = {
  toggle(tag: string) {
    selected = selected.includes(tag) ? selected.filter((x) => x !== tag) : [...selected, tag];
    emit();
  },
  clear() {
    selected = [];
    emit();
  },
};

export function useOverviewTags(): string[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selected,
  );
}
