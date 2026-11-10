/**
 * devSeed.ts
 * DEV-ONLY fallback: fills the local SQLite cache with fake monuments when the backend
 * is unreachable and the city has no data yet, so the UI can be checked without a server.
 * Never runs in release builds (guarded by __DEV__).
 * Test ids are prefixed with `test_` so they are easy to spot / purge.
 */

import realFieldConfigs from '../data/seed/monument_field_configs.json';
import realMonuments from '../data/seed/monuments.json';
import realTranslations from '../data/seed/monument_translations.json';
import type {
  ApiMonument,
  ApiMonumentFieldConfig,
  ApiMonumentTranslation,
} from '../services/monumentsApi';
import { db } from './database';
import {
  ensureCityRow,
  getMonumentCountByCity,
  getMonumentDbIdBySlug,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentTranslationsFromApi,
  upsertMonumentsFromApi,
} from './monumentRepository';
import {
  getAllRoutes,
  upsertRoutesFromSync,
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
} from './routeRepository';

type Texts = { name: string; address: string; description: string };

type TestMonument = {
  key: string;
  lat: number;
  lon: number;
  tags: string[];
  popularity: number;
  ru: Texts;
  en: Texts;
};

const TEST_MONUMENTS: TestMonument[] = [
  {
    key: 'motherland-calls',
    lat: 48.7422,
    lon: 44.537,
    tags: ['top', 'memorials', 'architecture', 'history'],
    popularity: 100,
    ru: {
      name: 'Родина-мать зовёт!',
      address: 'Мамаев курган',
      description: 'Главный монумент ансамбля «Героям Сталинградской битвы».',
    },
    en: {
      name: 'The Motherland Calls',
      address: 'Mamayev Kurgan',
      description: 'The central statue of the Battle of Stalingrad memorial.',
    },
  },
  {
    key: 'panorama-museum',
    lat: 48.7137,
    lon: 44.532,
    tags: ['museums', 'history', 'top'],
    popularity: 90,
    ru: {
      name: 'Музей-панорама «Сталинградская битва»',
      address: 'ул. Чуйкова, 47',
      description: 'Музейный комплекс с панорамой разгрома немецко-фашистских войск.',
    },
    en: {
      name: 'Battle of Stalingrad Panorama Museum',
      address: '47 Chuykova St',
      description: 'A museum complex with a panorama of the Stalingrad battle.',
    },
  },
  {
    key: 'pavlovs-house',
    lat: 48.7152,
    lon: 44.5254,
    tags: ['memorials', 'history'],
    popularity: 80,
    ru: {
      name: 'Дом Павлова',
      address: 'ул. Советская, 39',
      description: 'Дом сержанта Павлова, который оборонялся 58 дней.',
    },
    en: {
      name: "Pavlov's House",
      address: '39 Sovetskaya St',
      description: 'The apartment block defended for 58 days during the battle.',
    },
  },
  {
    key: 'alley-of-heroes',
    lat: 48.744,
    lon: 44.5392,
    tags: ['memorials', 'parks'],
    popularity: 70,
    ru: {
      name: 'Аллея Героев',
      address: 'Мамаев курган',
      description: 'Аллея с портретами героев Сталинградской битвы.',
    },
    en: {
      name: 'Alley of Heroes',
      address: 'Mamayev Kurgan',
      description: 'An alley with portraits of the battle heroes.',
    },
  },
  {
    key: 'embankment',
    lat: 48.7133,
    lon: 44.5071,
    tags: ['parks', 'nature', 'top'],
    popularity: 85,
    ru: {
      name: 'Центральная набережная',
      address: 'Набережная 62-й Армии',
      description: 'Главная прогулочная зона вдоль Волги.',
    },
    en: {
      name: 'Central Embankment',
      address: '62nd Army Embankment',
      description: 'The main promenade along the Volga river.',
    },
  },
  {
    key: 'gerhardt-mill',
    lat: 48.7099,
    lon: 44.5231,
    tags: ['history', 'architecture'],
    popularity: 60,
    ru: {
      name: 'Мельница Гергардта',
      address: 'ул. Рабоче-Крестьянская, 2',
      description: 'Руины мельницы — символ разрушенного города.',
    },
    en: {
      name: 'Gerhardt Mill',
      address: '2 Raboche-Krestyanskaya St',
      description: 'The ruined mill, a symbol of the destroyed city.',
    },
  },
  {
    key: 'planetarium',
    lat: 48.719,
    lon: 44.5136,
    tags: ['museums', 'architecture'],
    popularity: 55,
    ru: {
      name: 'Волгоградский планетарий',
      address: 'пр. Ленина, 20',
      description: 'Один из старейших планетариев страны.',
    },
    en: {
      name: 'Volgograd Planetarium',
      address: '20 Lenina Ave',
      description: 'One of the oldest planetariums in the country.',
    },
  },
  {
    key: 'lysaya-gora',
    lat: 48.7852,
    lon: 44.7016,
    tags: ['memorials', 'nature', 'history'],
    popularity: 72,
    ru: {
      name: 'Мемориал «Лысая гора»',
      address: 'Советский район',
      description: 'Мемориальный комплекс на месте боёв 1942 года.',
    },
    en: {
      name: 'Lysaya Gora Memorial',
      address: 'Sovetsky district',
      description: 'A memorial complex on the 1942 battlefield.',
    },
  },
  {
    key: 'children-fountain',
    lat: 48.7152,
    lon: 44.529,
    tags: ['history', 'architecture'],
    popularity: 65,
    ru: {
      name: 'Фонтан «Детский хоровод»',
      address: 'Привокзальная площадь',
      description: 'Скульптурная композиция на площади у вокзала.',
    },
    en: {
      name: 'Children Round Dance Fountain',
      address: 'Station Square',
      description: 'A sculptural fountain at the railway station.',
    },
  },
  {
    key: 'first-tram',
    lat: 48.7078,
    lon: 44.5149,
    tags: ['history', 'museums'],
    popularity: 45,
    ru: {
      name: 'Памятник первому трамваю',
      address: 'ул. Мира',
      description: 'Памятник в честь запуска трамвая в Царицыне.',
    },
    en: {
      name: 'First Tram Monument',
      address: 'Mira St',
      description: 'A monument marking the first tram line in Tsaritsyn.',
    },
  },
  {
    key: 'my-history-park',
    lat: 48.707,
    lon: 44.5266,
    tags: ['museums', 'parks', 'top'],
    popularity: 78,
    ru: {
      name: 'Парк «Россия — моя история»',
      address: 'ул. Рабоче-Крестьянская, 14',
      description: 'Мультимедийный исторический парк.',
    },
    en: {
      name: 'Russia — My History Park',
      address: '14 Raboche-Krestyanskaya St',
      description: 'A multimedia history park.',
    },
  },
  {
    key: 'tsaritsyn-opera',
    lat: 48.7203,
    lon: 44.5131,
    tags: ['architecture'],
    popularity: 50,
    ru: {
      name: 'Царицынская опера',
      address: 'ул. Гоголя, 1',
      description: 'Современный театральный комплекс.',
    },
    en: {
      name: 'Tsaritsyn Opera',
      address: '1 Gogolya St',
      description: 'A modern theatre complex.',
    },
  },
];

function cityHasOnlyTestMonuments(cityId: string): boolean {
  const row = db.getFirstSync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM monuments m JOIN cities c ON c.id = m.city_id
     WHERE c.slug = ? AND substr(m.slug, 1, 5) <> 'test_'`,
    [cityId],
  );
  return (row?.n ?? 0) === 0;
}

/** Real content from backend/data (bundled copy) with placeholder photos. Volgograd only. */
function seedRealMonuments(cityId: string): boolean {
  const monuments = (realMonuments as ApiMonument[]).filter((m) => m.city_id === cityId);
  if (monuments.length === 0) return false;
  const ids = new Set(monuments.map((m) => m.id));
  // Drop earlier fake data for this city (routes first: route_stops RESTRICT monuments).
  const cityDbId = ensureCityRow(cityId);
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM routes WHERE city_id = ? AND substr(slug, 1, 5) = 'test_'`, [cityDbId]);
    db.runSync(`DELETE FROM monuments WHERE city_id = ? AND substr(slug, 1, 5) = 'test_'`, [cityDbId]);
  });
  upsertMonumentsFromApi(
    cityId,
    monuments.map((m) => ({
      ...m,
      image_url: `https://picsum.photos/seed/${m.id}/600/750`,
    })),
  );
  upsertMonumentTranslationsFromApi(
    (realTranslations as ApiMonumentTranslation[]).filter((t) => ids.has(t.monument_id)),
  );
  upsertMonumentFieldConfigsFromApi(
    (realFieldConfigs as ApiMonumentFieldConfig[]).filter((c) => ids.has(c.monument_id)),
  );
  return true;
}

/** Inserts dev monuments for `cityId` if it has none. Returns true when anything was written. */
export function seedTestMonumentsIfEmpty(cityId: string): boolean {
  if (!__DEV__) return false;
  const hasOnlyFakes = getMonumentCountByCity(cityId) > 0 && cityHasOnlyTestMonuments(cityId);
  if (getMonumentCountByCity(cityId) > 0 && !hasOnlyFakes) return false;
  if (seedRealMonuments(cityId)) return true;
  if (hasOnlyFakes) return false;

  const monuments: ApiMonument[] = [];
  const translations: ApiMonumentTranslation[] = [];

  TEST_MONUMENTS.forEach((m, i) => {
    const id = `test_${cityId}_${m.key}`;
    monuments.push({
      id,
      city_id: cityId,
      lat: m.lat,
      lon: m.lon,
      image_url: `https://picsum.photos/seed/${m.key}/600/750`,
      sort_order: i + 1,
    });
    for (const lang of ['ru', 'en', 'ar', 'zh'] as const) {
      const tr = lang === 'ru' ? m.ru : m.en;
      translations.push(
        { monument_id: id, lang, field_key: 'name', field_value: tr.name },
        { monument_id: id, lang, field_key: 'address', field_value: tr.address },
        { monument_id: id, lang, field_key: 'short_description', field_value: tr.description },
      );
    }
  });

  upsertMonumentsFromApi(cityId, monuments);
  upsertMonumentTranslationsFromApi(translations);

  const cityDbId = ensureCityRow(cityId);
  db.withTransactionSync(() => {
    for (const m of TEST_MONUMENTS) {
      db.runSync(
        `UPDATE monuments SET tags_json = ?, popularity = ? WHERE city_id = ? AND slug = ?`,
        [JSON.stringify(m.tags), m.popularity, cityDbId, `test_${cityId}_${m.key}`],
      );
    }
  });
  return true;
}

const TEST_ROUTES: {
  key: string;
  stops: string[];
  ru: { name: string; description: string };
  en: { name: string; description: string };
}[] = [
  {
    key: 'stalingrad',
    stops: ['motherland-calls', 'alley-of-heroes', 'pavlovs-house', 'panorama-museum', 'gerhardt-mill'],
    ru: {
      name: 'Сталинградская битва',
      description: 'Главные места памяти: от Мамаева кургана до руин мельницы Гергардта.',
    },
    en: {
      name: 'Battle of Stalingrad',
      description: 'The main memorial sites, from Mamayev Kurgan to the ruins of Gerhardt Mill.',
    },
  },
  {
    key: 'volga-embankment',
    stops: ['embankment', 'children-fountain', 'first-tram', 'planetarium'],
    ru: {
      name: 'Прогулка по набережной',
      description: 'Спокойный маршрут вдоль Волги с фонтанами и городскими символами.',
    },
    en: {
      name: 'Embankment walk',
      description: 'A relaxed route along the Volga with fountains and city landmarks.',
    },
  },
  {
    key: 'with-kids',
    stops: ['my-history-park', 'planetarium', 'children-fountain'],
    ru: {
      name: 'С детьми',
      description: 'Интерактивные места, где интересно и детям, и взрослым.',
    },
    en: {
      name: 'With kids',
      description: 'Interactive places that both kids and adults will enjoy.',
    },
  },
];

/** DEV only: adds 3 fake routes over the test monuments if the city has no routes yet. */
export function seedTestRoutesIfEmpty(cityId: string): boolean {
  if (!__DEV__) return false;
  if (getAllRoutes('ru', cityId).length > 0) return false;
  // Routes need the test monuments to exist.
  if (getMonumentDbIdBySlug(`test_${cityId}_${TEST_ROUTES[0].stops[0]}`) === null) return false;

  const slug = (key: string) => `test_${cityId}_${key}`;
  upsertRoutesFromSync(
    cityId,
    TEST_ROUTES.map((r, i) => ({
      id: slug(r.key),
      cover_monument_id: slug(r.stops[0]),
      sort_order: i + 1,
    })),
  );
  upsertRouteStopsFromSync(
    TEST_ROUTES.flatMap((r) =>
      r.stops.map((stopKey, order) => ({
        route_id: slug(r.key),
        monument_id: slug(stopKey),
        order_index: order + 1,
      })),
    ),
  );
  upsertRouteTranslationsFromSync(
    TEST_ROUTES.flatMap((r) =>
      (['ru', 'en', 'ar', 'zh'] as const).map((lang) => ({
        route_id: slug(r.key),
        lang,
        name: (lang === 'ru' ? r.ru : r.en).name,
        description: (lang === 'ru' ? r.ru : r.en).description,
      })),
    ),
  );
  return true;
}
