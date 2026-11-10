/**
 * externalMaps.ts
 * Deep links into third-party map apps: show a place or build a walking route to it.
 * Each provider has its own URL format; if the app isn't installed (custom scheme fails),
 * we fall back to the provider's https link (universal link / website).
 */

import { Linking } from 'react-native';

export type MapProviderId = 'apple' | 'google' | 'yandex';

export type MapTarget = { lat: number; lon: number; name?: string };

type Provider = {
  id: MapProviderId;
  /** Name shown in the menu (brand names are not translated). */
  title: string;
  symbol: string;
  place: (t: MapTarget) => { app: string; web: string };
  route: (t: MapTarget) => { app: string; web: string };
};

const q = (s?: string) => encodeURIComponent(s ?? '');

export const MAP_PROVIDERS: Provider[] = [
  {
    id: 'yandex',
    title: 'Яндекс Карты',
    symbol: 'map',
    place: ({ lat, lon }) => ({
      app: `yandexmaps://maps.yandex.ru/?pt=${lon},${lat}&z=16&l=map`,
      web: `https://yandex.ru/maps/?pt=${lon},${lat}&z=16&l=map`,
    }),
    // rtext=<from>~<to>; empty "from" = current location. rtt=pd = pedestrian.
    route: ({ lat, lon }) => ({
      app: `yandexmaps://maps.yandex.ru/?rtext=~${lat},${lon}&rtt=pd`,
      web: `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=pd`,
    }),
  },
  {
    id: 'apple',
    title: 'Apple Maps',
    symbol: 'map.fill',
    place: ({ lat, lon, name }) => {
      const url = `maps://?ll=${lat},${lon}&q=${q(name)}`;
      return { app: url, web: `https://maps.apple.com/?ll=${lat},${lon}&q=${q(name)}` };
    },
    route: ({ lat, lon, name }) => {
      const url = `maps://?daddr=${lat},${lon}&dirflg=w&q=${q(name)}`;
      return { app: url, web: `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=w` };
    },
  },
  {
    id: 'google',
    title: 'Google Maps',
    symbol: 'globe',
    place: ({ lat, lon }) => ({
      app: `comgooglemaps://?q=${lat},${lon}`,
      web: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    }),
    route: ({ lat, lon }) => ({
      app: `comgooglemaps://?daddr=${lat},${lon}&directionsmode=walking`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`,
    }),
  },
];

async function open(links: { app: string; web: string }): Promise<void> {
  try {
    await Linking.openURL(links.app);
  } catch {
    await Linking.openURL(links.web).catch(() => {});
  }
}

export function openPlaceIn(provider: Provider, target: MapTarget): Promise<void> {
  return open(provider.place(target));
}

export function openRouteIn(provider: Provider, target: MapTarget): Promise<void> {
  return open(provider.route(target));
}
