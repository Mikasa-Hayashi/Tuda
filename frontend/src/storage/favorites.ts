import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorites.monumentIds';

export async function getFavoriteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Adds or removes the monument; resolves to the new "is favorite" state. */
export async function toggleFavorite(monumentId: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  const isFav = ids.includes(monumentId);
  const next = isFav ? ids.filter((x) => x !== monumentId) : [...ids, monumentId];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return !isFav;
}
