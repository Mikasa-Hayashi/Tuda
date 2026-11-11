import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/** Map display modes, picked from the layers menu in the header. */
export type MapMode = 'explore' | 'hybrid' | 'satellite';

export const MAP_MODES: {
  id: MapMode;
  mapType: 'standard' | 'hybrid' | 'satellite';
  icon: string;
  label: string;
}[] = [
  { id: 'explore', mapType: 'standard', icon: 'map', label: 'map.mode_explore' },
  { id: 'hybrid', mapType: 'hybrid', icon: 'square.stack.3d.up', label: 'map.type_hybrid' },
  {
    id: 'satellite',
    mapType: 'satellite',
    icon: 'globe.europe.africa',
    label: 'map.type_satellite',
  },
];

const KEY = 'map.mode';
let mode: MapMode = 'explore';
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw && MAP_MODES.some((m) => m.id === raw)) {
      mode = raw as MapMode;
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

export function setMapMode(next: MapMode) {
  mode = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, next).catch(() => {});
}

export function useMapMode() {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => mode,
  );
  return { mode: current, ...(MAP_MODES.find((m) => m.id === current) ?? MAP_MODES[0]) };
}
