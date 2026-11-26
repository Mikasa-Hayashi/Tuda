import { useCallback } from 'react';
import { personalData, usePersonalData } from './personalData';

/** The user's own route holds monument IDs in visiting order. */
export function toggleCustomRouteStop(id: string): boolean {
  const ids = personalData.get().customRoute;
  const has = ids.includes(id);
  setCustomRoute(has ? ids.filter((x) => x !== id) : [...ids, id]);
  return !has;
}

export function setCustomRoute(ids: string[]) {
  void personalData.set('customRoute', ids);
}

export function useCustomRoute() {
  const ids = usePersonalData('customRoute');
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, has, toggle: toggleCustomRouteStop, set: setCustomRoute };
}
