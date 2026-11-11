import { getRouteById } from '@/src/db/routeRepository';
import { getMonumentCoords } from '@/src/db/monumentRepository';
import { Linking } from 'react-native';

export type MapApp = 'yandex' | 'google' | 'twogis';

export const MAP_APPS: { app: MapApp; name: string; icon: string }[] = [
  { app: 'yandex', name: 'Яндекс Карты', icon: 'map' },
  { app: 'twogis', name: '2ГИС', icon: 'mappin.and.ellipse' },
  { app: 'google', name: 'Google Maps', icon: 'globe' },
];

type Point = { lat: number; lon: number };

function routePoints(routeId: string): Point[] {
  const route = getRouteById(routeId, 'ru');
  if (!route) return [];
  const points: Point[] = [];
  for (const stop of route.stops) {
    const c = getMonumentCoords(stop.id);
    if (c) points.push({ lat: c.lat, lon: c.lon });
  }
  return points;
}

/** [app link, web fallback] for a walking route through all stops. */
function links(app: MapApp, p: Point[]): [string, string] {
  const first = p[0];
  const last = p[p.length - 1];
  switch (app) {
    case 'yandex': {
      const rtext = p.map((x) => `${x.lat},${x.lon}`).join('~');
      const query = p.length > 1 ? `rtext=${rtext}&rtt=pd` : `pt=${first.lon},${first.lat}&z=15`;
      return [`yandexmaps://maps.yandex.ru/?${query}`, `https://yandex.ru/maps/?${query}`];
    }
    case 'google': {
      const via = p
        .slice(1, -1)
        .map((x) => `${x.lat},${x.lon}`)
        .join('|');
      const web =
        `https://www.google.com/maps/dir/?api=1&travelmode=walking` +
        `&origin=${first.lat},${first.lon}&destination=${last.lat},${last.lon}` +
        (via ? `&waypoints=${encodeURIComponent(via)}` : '');
      return [web, web];
    }
    case 'twogis': {
      // 2GIS deep links take only a start and an end point, so intermediate stops are left out.
      const path = `routeSearch/rsType/pedestrian/from/${first.lon},${first.lat}/to/${last.lon},${last.lat}`;
      return [`dgis://2gis.ru/${path}`, `https://2gis.ru/${path}`];
    }
  }
}

/** Opens the route in the chosen maps app if it is installed, otherwise on its website. */
export async function openRouteInMaps(app: MapApp, routeId: string) {
  const points = routePoints(routeId);
  if (points.length === 0) return;
  const [appUrl, webUrl] = links(app, points);
  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl).catch(() => {});
  }
}
