/**
 * monumentRepository.ts
 * Заменяет старый monumentStore.ts.
 * Все запросы к SQLite, API такой же как был — компоненты почти не меняются.
 */

import { monumentFilterMeta } from '../data/monumentFilterMeta';
import { db } from './database';

/** Writes tags_json + popularity from monumentFilterMeta (idempotent; run each launch). */
export function syncMonumentFilterMetadata(): void {
  for (const [slug, meta] of Object.entries(monumentFilterMeta)) {
    const tagsJson = JSON.stringify(meta.tags);
    db.runSync(`UPDATE monuments SET tags_json = ?, popularity = ? WHERE slug = ?`, [
      tagsJson,
      meta.popularity,
      slug,
    ]);
  }
}

export function getMonumentCountsByCity(): Record<string, number> {
  const rows = db.getAllSync<{ city_slug: string; cnt: number }>(
    `SELECT c.slug as city_slug, COUNT(*) as cnt
     FROM monuments m
     JOIN cities c ON c.id = m.city_id
     GROUP BY c.slug`,
  );

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.city_slug] = row.cnt ?? 0;
    return acc;
  }, {});
}

// ─── Типы (совместимы со старым monumentStore) ────────────────────────────────

export type FieldConfigRow = {
  labelKey: string;
  value: string | null;  // готовое значение (уже переведённое или static)
};

export type Monument = {
  id: string;
  lat: number;
  lon: number;
  imageUrl: string;
  name: string;
  location: string;
  description: string;
  details: FieldConfigRow[];
  visitors: FieldConfigRow[];
};

export type MonumentPreview = {
  id: string;
  lat: number;
  lon: number;
  imageUrl: string;
  name: string;
  tags: string[];
  popularity: number;
  sortOrder: number;
};

// ─── Запросы ──────────────────────────────────────────────────────────────────

function parseTagsJson(raw: string | null | undefined): string[] {
  if (raw == null || raw === '') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function mapPreviewRow(r: {
  id: number;
  slug: string;
  lat: number;
  lon: number;
  image_url: string;
  field_value: string | null;
  sort_order: number;
  popularity: number;
  tags_json: string | null;
}): MonumentPreview {
  return {
    id: r.slug,
    lat: r.lat,
    lon: r.lon,
    imageUrl: r.image_url,
    name: r.field_value ?? '',
    tags: parseTagsJson(r.tags_json),
    popularity: r.popularity ?? 0,
    sortOrder: r.sort_order ?? 0,
  };
}

/** Все памятники для списка/карты (без тяжёлых полей) */
export function getAllMonumentPreviews(lang: string, cityId?: string | null): MonumentPreview[] {
  const rows = db.getAllSync<{
    id: number;
    slug: string;
    lat: number;
    lon: number;
    image_url: string;
    field_value: string | null;
    sort_order: number;
    popularity: number;
    tags_json: string | null;
  }>(
    `SELECT m.id, m.slug, m.lat, m.lon, m.image_url, m.sort_order, m.popularity, m.tags_json, mt.field_value
     FROM monuments m
     JOIN cities c ON c.id = m.city_id
     LEFT JOIN monument_translations mt
       ON mt.monument_id = m.id AND mt.lang = ? AND mt.field_key = 'name'
     WHERE (? IS NULL OR c.slug = ?)
     ORDER BY m.sort_order`,
    [lang, cityId ?? null, cityId ?? null]
  );

  return rows.map(mapPreviewRow);
}

/** Один памятник со всеми полями */
export function getMonumentById(id: string, lang: string): Monument | null {
  const base = db.getFirstSync<{ id: number; slug: string; lat: number; lon: number; image_url: string }>(
    `SELECT id, slug, lat, lon, image_url FROM monuments WHERE slug = ?`,
    [id]
  );
  if (!base) return null;

  // Все переводы для этого памятника и языка в виде Map
  const translationRows = db.getAllSync<{ field_key: string; field_value: string }>(
    `SELECT field_key, field_value
     FROM monument_translations
     WHERE monument_id = ? AND lang = ?`,
    [base.id, lang]
  );
  const translations = new Map(translationRows.map(r => [r.field_key, r.field_value]));

  // Конфигурация полей
  const fieldConfigs = db.getAllSync<{
    section: string; label_key: string; field_key: string | null; static_value: string | null;
  }>(
    `SELECT section, label_key, field_key, static_value
     FROM monument_field_config
     WHERE monument_id = ?
     ORDER BY section, order_index`,
    [base.id]
  );

  const details: FieldConfigRow[] = [];
  const visitors: FieldConfigRow[] = [];

  for (const fc of fieldConfigs) {
    const value = fc.static_value ?? (fc.field_key ? translations.get(fc.field_key) ?? null : null);
    const row: FieldConfigRow = { labelKey: fc.label_key, value };
    if (fc.section === 'details') details.push(row);
    else visitors.push(row);
  }

  return {
    id: base.slug,
    lat: base.lat,
    lon: base.lon,
    imageUrl: base.image_url,
    name: translations.get('name') ?? '',
    location: translations.get('location') ?? '',
    description: translations.get('description') ?? '',
    details,
    visitors,
  };
}

/** Координаты памятника (для маршрутов, без перевода) */
export function getMonumentCoords(id: string): { lat: number; lon: number } | null {
  return db.getFirstSync<{ lat: number; lon: number }>(
    `SELECT lat, lon FROM monuments WHERE slug = ?`,
    [id]
  ) ?? null;
}

/** Поиск памятников по имени */
export function searchMonuments(query: string, lang: string, cityId?: string | null): MonumentPreview[] {
  const rows = db.getAllSync<{
    id: number;
    slug: string;
    lat: number;
    lon: number;
    image_url: string;
    field_value: string;
    sort_order: number;
    popularity: number;
    tags_json: string | null;
  }>(
    `SELECT m.id, m.slug, m.lat, m.lon, m.image_url, m.sort_order, m.popularity, m.tags_json, mt.field_value
     FROM monuments m
     JOIN cities c ON c.id = m.city_id
     JOIN monument_translations mt
       ON mt.monument_id = m.id AND mt.lang = ? AND mt.field_key = 'name'
     WHERE mt.field_value LIKE ?
       AND (? IS NULL OR c.slug = ?)
     ORDER BY m.sort_order`,
    [lang, `%${query}%`, cityId ?? null, cityId ?? null]
  );

  return rows.map(mapPreviewRow);
}

/** Ближайшие памятники к точке (GPS-поиск, офлайн) */
export function getNearbyMonuments(
  lat: number,
  lon: number,
  radiusKm: number,
  lang: string,
  cityId?: string | null
): (MonumentPreview & { distanceKm: number })[] {
  // Формула Хаверсина прямо в SQL (приближённая, достаточна для малых расстояний)
  const rows = db.getAllSync<{
    id: number;
    slug: string;
    lat: number;
    lon: number;
    image_url: string;
    field_value: string | null;
    sort_order: number;
    popularity: number;
    tags_json: string | null;
  }>(
    `SELECT m.id, m.slug, m.lat, m.lon, m.image_url, m.sort_order, m.popularity, m.tags_json, mt.field_value
     FROM monuments m
     JOIN cities c ON c.id = m.city_id
     LEFT JOIN monument_translations mt
       ON mt.monument_id = m.id AND mt.lang = ? AND mt.field_key = 'name'
     WHERE (? IS NULL OR c.slug = ?)
     ORDER BY m.sort_order`,
    [lang, cityId ?? null, cityId ?? null]
  );

  const R = 6371; // радиус Земли в км
  return rows
    .map(r => {
      const dLat = ((r.lat - lat) * Math.PI) / 180;
      const dLon = ((r.lon - lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((r.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...mapPreviewRow(r), distanceKm };
    })
    .filter(r => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
