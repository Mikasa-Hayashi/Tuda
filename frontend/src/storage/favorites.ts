import { useCallback } from 'react';
import { personalData, usePersonalData } from './personalData';

export type FavoriteKind = 'monument' | 'route';

/** Adds or removes the item and persists the change. */
export async function toggleFavorite(kind: FavoriteKind, id: string): Promise<boolean> {
  const key = kind === 'monument' ? 'monumentFavorites' : 'routeFavorites';
  const current = personalData.get()[key];
  const isFav = current.includes(id);
  const next = isFav ? current.filter((x) => x !== id) : [...current, id];
  await personalData.set(key, next);
  return !isFav;
}

export function useFavorites() {
  const monumentIds = usePersonalData('monumentFavorites');
  const routeIds = usePersonalData('routeFavorites');
  const isFavorite = useCallback(
    (kind: FavoriteKind, id: string) => (kind === 'monument' ? monumentIds : routeIds).includes(id),
    [monumentIds, routeIds],
  );
  return {
    monumentIds,
    routeIds,
    count: monumentIds.length + routeIds.length,
    isFavorite,
    toggle: toggleFavorite,
  };
}
