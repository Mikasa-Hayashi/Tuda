/**
 * routeRepository.ts — заменяет старый routeStore.ts
 */

import { db } from './database';
import { getMonumentCoords } from './monumentRepository';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type RoutePreview = {
  id: string;
  citySlug: string;
  routeSlug: string;
  coverMonumentId: string;
  name: string;
  description: string;
  stopCount: number;
  coverImageUrl: string;
};

export type RouteStop = {
  id: string;
  name: string;
};

export type RouteDetail = RoutePreview & {
  monumentIds: string[];      // порядковый список ID остановок
  stops: RouteStop[];         // ID + имя (для отображения в route-info)
};

export type ResolvedMapPoint = {
  id: string;
  lat: number;
  lon: number;
  name: string;
};

// ─── Вспомогательная: одна строка перевода маршрута ──────────────────────────

function fetchRouteTranslation(
  routeId: number,
  lang: string,
): { name: string; description: string } | null {
  const row = db.getFirstSync<{ name: string; description: string }>(
    `SELECT name, description FROM route_translations WHERE route_id = ? AND lang = ?`,
    [routeId, lang],
  );
  // Фолбэк на ru, если перевод отсутствует
  if (!row) {
    return (
      db.getFirstSync<{ name: string; description: string }>(
        `SELECT name, description FROM route_translations WHERE route_id = ? AND lang = 'ru'`,
        [routeId],
      ) ?? null
    );
  }
  return row;
}

// ─── Запросы ──────────────────────────────────────────────────────────────────

/** Все маршруты для списка (menu.tsx) */
export function getAllRoutes(lang: string, citySlug?: string | null): RoutePreview[] {
  const rows = db.getAllSync<{
    id: number;
    city_slug: string;
    route_slug: string;
    cover_monument_slug: string | null;
    image_url: string;
  }>(
    `SELECT r.id, c.slug as city_slug, r.slug as route_slug, cm.slug as cover_monument_slug, m.image_url
     FROM routes r
     JOIN cities c ON c.id = r.city_id
     LEFT JOIN monuments m ON m.id = r.cover_monument_id
     LEFT JOIN monuments cm ON cm.id = r.cover_monument_id
     WHERE (? IS NULL OR c.slug = ?)
     ORDER BY r.sort_order`,
    [citySlug ?? null, citySlug ?? null],
  );

  return rows.map((r) => {
    const tr = fetchRouteTranslation(r.id, lang);
    const stopCount =
      db.getFirstSync<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM route_stops WHERE route_id = ?`,
        [r.id],
      )?.cnt ?? 0;

    return {
      id: `${r.city_slug}:${r.route_slug}`,
      citySlug: r.city_slug,
      routeSlug: r.route_slug,
      coverMonumentId: r.cover_monument_slug ?? '',
      name: tr?.name ?? '',
      description: tr?.description ?? '',
      stopCount,
      coverImageUrl: r.image_url ?? '',
    };
  });
}

/** Один маршрут со всеми остановками (route-info.tsx) */
export function getRouteById(id: string, lang: string): RouteDetail | null {
  const [citySlug, routeSlug] = id.split(':');
  if (!citySlug || !routeSlug) return null;

  const base = db.getFirstSync<{
    id: number;
    city_slug: string;
    route_slug: string;
    cover_monument_slug: string | null;
    image_url: string;
  }>(
    `SELECT r.id, c.slug as city_slug, r.slug as route_slug, cm.slug as cover_monument_slug, m.image_url
     FROM routes r
     JOIN cities c ON c.id = r.city_id
     LEFT JOIN monuments m ON m.id = r.cover_monument_id
     LEFT JOIN monuments cm ON cm.id = r.cover_monument_id
     WHERE c.slug = ? AND r.slug = ?`,
    [citySlug, routeSlug],
  );
  if (!base) return null;

  const tr = fetchRouteTranslation(base.id, lang);

  const stopRows = db.getAllSync<{ monument_slug: string }>(
    `SELECT m.slug as monument_slug
     FROM route_stops rs
     JOIN monuments m ON m.id = rs.monument_id
     WHERE rs.route_id = ?
     ORDER BY rs.order_index`,
    [base.id],
  );

  const stops: RouteStop[] = stopRows.map((s) => {
    const nameRow = db.getFirstSync<{ field_value: string }>(
      `SELECT mt.field_value
       FROM monument_translations mt
       JOIN monuments m ON m.id = mt.monument_id
       WHERE m.slug = ? AND mt.lang = ? AND mt.field_key = 'name'`,
      [s.monument_slug, lang],
    );
    return { id: s.monument_slug, name: nameRow?.field_value ?? '' };
  });

  const stopCount =
    db.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM route_stops WHERE route_id = ?`,
      [base.id],
    )?.cnt ?? 0;

  return {
    id: `${base.city_slug}:${base.route_slug}`,
    citySlug: base.city_slug,
    routeSlug: base.route_slug,
    coverMonumentId: base.cover_monument_slug ?? '',
    coverImageUrl: base.image_url ?? '',
    name: tr?.name ?? '',
    description: tr?.description ?? '',
    stopCount,
    monumentIds: stopRows.map((s) => s.monument_slug),
    stops,
  };
}

/** Остановки маршрута с координатами (index.tsx — карта) */
export function getResolvedRouteMapPoints(
  routeId: string,
  lang: string,
): ResolvedMapPoint[] {
  const route = getRouteById(routeId, lang);
  if (!route) return [];

  const stops = db.getAllSync<{ monument_slug: string }>(
    `SELECT m.slug as monument_slug
     FROM route_stops rs
     JOIN monuments m ON m.id = rs.monument_id
     WHERE rs.route_id = (
       SELECT r.id FROM routes r
       JOIN cities c ON c.id = r.city_id
       WHERE c.slug = ? AND r.slug = ?
     )
     ORDER BY rs.order_index`,
    [route.citySlug, route.routeSlug],
  );

  const result: ResolvedMapPoint[] = [];
  for (const stop of stops) {
    const coords = getMonumentCoords(stop.monument_slug);
    if (!coords) continue;

    const nameRow = db.getFirstSync<{ field_value: string }>(
      `SELECT mt.field_value
       FROM monument_translations mt
       JOIN monuments m ON m.id = mt.monument_id
       WHERE m.slug = ? AND mt.lang = ? AND mt.field_key = 'name'`,
      [stop.monument_slug, lang],
    );

    result.push({
      id: stop.monument_slug,
      lat: coords.lat,
      lon: coords.lon,
      name: nameRow?.field_value ?? '',
    });
  }
  return result;
}

/** Ссылка на Яндекс.Карты с маршрутом */
export function buildYandexRouteUrl(routeId: string): string {
  const route = getRouteById(routeId, 'ru');
  if (!route) return 'https://yandex.ru/maps/';

  const parts: string[] = [];
  for (const stop of route.stops) {
    const coords = getMonumentCoords(stop.id);
    if (coords) parts.push(`${coords.lat},${coords.lon}`);
  }

  if (parts.length === 0) return 'https://yandex.ru/maps/';
  if (parts.length === 1) {
    const [lat, lon] = parts[0].split(',');
    return `https://yandex.ru/maps/?pt=${lon},${lat}&z=14&l=map`;
  }
  return `https://yandex.ru/maps/?rtext=${parts.join('~')}&rtt=auto`;
}
