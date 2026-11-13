/**
 * Texts shipped inside the app (src/data/seed, copied from backend/data by `npm run seed:sync`).
 * On first launch they fill SQLite so every monument and route reads offline right away; the
 * server sync then only brings what changed. Photos are not part of the bundle (see mediaUrl).
 */
import type {
  ApiMonument,
  ApiMonumentFieldConfig,
  ApiMonumentTranslation,
  ApiRoute,
  ApiRouteStop,
  ApiRouteTranslation,
} from '../services/monumentsApi';
import fieldConfigs from '../data/seed/monument_field_configs.json';
import translations from '../data/seed/monument_translations.json';
import monuments from '../data/seed/monuments.json';
import routeStops from '../data/seed/route_stops.json';
import routeTranslations from '../data/seed/route_translations.json';
import routes from '../data/seed/routes.json';
import { db } from './database';
import {
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentTranslationsFromApi,
  upsertMonumentsFromApi,
} from './monumentRepository';
import {
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
  upsertRoutesFromSync,
} from './routeRepository';

/** Bump when the bundled seed changes so existing installs pick the new texts up. */
const SEED_VERSION = '7';
const META_KEY = 'bundled_seed_version';

export function applyBundledSeed(force = false): void {
  const done = db.getFirstSync<{ value: string }>(`SELECT value FROM app_meta WHERE key = ?`, [
    META_KEY,
  ]);
  if (!force && done?.value === SEED_VERSION) return;

  const monumentList = monuments as ApiMonument[];
  const cityOfMonument = new Map(monumentList.map((m) => [m.id, m.city_id]));
  const cities = [...new Set(monumentList.map((m) => m.city_id))];
  for (const city of cities) {
    upsertMonumentsFromApi(
      city,
      monumentList.filter((m) => m.city_id === city),
    );
  }
  upsertMonumentTranslationsFromApi(translations as ApiMonumentTranslation[]);
  upsertMonumentFieldConfigsFromApi(fieldConfigs as ApiMonumentFieldConfig[]);

  const routeList = routes as ApiRoute[];
  for (const city of cities) {
    upsertRoutesFromSync(
      city,
      routeList.filter(
        (r) => r.cover_monument_id && cityOfMonument.get(r.cover_monument_id) === city,
      ),
    );
  }
  upsertRouteStopsFromSync(routeStops as ApiRouteStop[]);
  upsertRouteTranslationsFromSync(routeTranslations as ApiRouteTranslation[]);

  db.runSync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`, [
    META_KEY,
    SEED_VERSION,
  ]);
}
