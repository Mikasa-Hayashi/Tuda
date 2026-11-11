import { prefetchCityImages } from '@/src/services/imagePrefetch';
import { syncCityData } from '@/src/services/monumentsApi';
import {
  applyDeletedFromSync,
  getSyncMeta,
  setSyncMeta,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import {
  upsertRoutesFromSync,
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
} from '@/src/db/routeRepository';

const EPOCH = '1970-01-01T00:00:00.000Z';

/**
 * Pulls what changed on the server since the last sync into SQLite (monuments, routes, their
 * texts, deletions) and warms the photo cache. Throws when the server cannot be reached.
 * Shared by the Overview and Routes tabs (pull to refresh).
 */
export async function runCitySync(cityId: string, sinceIso?: string): Promise<void> {
  const since = sinceIso ?? getSyncMeta(cityId, 'last_sync') ?? EPOCH;
  const payload = await syncCityData(cityId, since);
  applyDeletedFromSync(payload.deleted_ids);
  upsertMonumentsFromApi(cityId, payload.monuments);
  upsertMonumentTranslationsFromApi(payload.monument_translations);
  upsertMonumentFieldConfigsFromApi(payload.monument_field_configs);
  upsertRoutesFromSync(cityId, payload.routes);
  upsertRouteStopsFromSync(payload.route_stops);
  upsertRouteTranslationsFromSync(payload.route_translations);
  setSyncMeta(cityId, 'last_sync', new Date().toISOString());
  void prefetchCityImages(cityId);
}
