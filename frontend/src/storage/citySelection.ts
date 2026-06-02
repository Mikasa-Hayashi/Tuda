import AsyncStorage from '@react-native-async-storage/async-storage';
import { CITIES } from '@/src/data/cities';

const ONBOARDING_DONE_KEY = 'citySelection.onboardingDone';
const SELECTED_CITY_ID_KEY = 'citySelection.selectedCityId';
const DOWNLOADED_CITY_IDS_KEY = 'citySelection.downloadedCityIds';
const AVAILABLE_CITY_IDS = new Set(CITIES.map((city) => city.id));

export async function getOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return value === 'true';
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, String(done));
}

export async function getSelectedCityId(): Promise<string | null> {
  const cityId = await AsyncStorage.getItem(SELECTED_CITY_ID_KEY);
  if (!cityId || AVAILABLE_CITY_IDS.has(cityId)) return cityId;
  await AsyncStorage.removeItem(SELECTED_CITY_ID_KEY);
  return null;
}

export async function setSelectedCityId(cityId: string): Promise<void> {
  await AsyncStorage.setItem(SELECTED_CITY_ID_KEY, cityId);
}

export async function getDownloadedCityIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DOWNLOADED_CITY_IDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const filtered = Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && AVAILABLE_CITY_IDS.has(x))
      : [];
    if (Array.isArray(parsed) && filtered.length !== parsed.length) {
      await AsyncStorage.setItem(DOWNLOADED_CITY_IDS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

export async function setDownloadedCityIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADED_CITY_IDS_KEY, JSON.stringify(ids));
}

export async function toggleCityDownloaded(cityId: string): Promise<string[]> {
  const ids = await getDownloadedCityIds();
  const next = ids.includes(cityId) ? ids.filter((id) => id !== cityId) : [...ids, cityId];
  await setDownloadedCityIds(next);
  return next;
}
