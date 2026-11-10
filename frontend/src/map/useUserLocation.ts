import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type Coords = { lat: number; lon: number };

/**
 * Current position, best effort: asks for "when in use" permission once, falls back to the
 * last known position, and resolves to null if denied or unavailable. Never throws.
 */
export function useUserLocation(): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === Location.PermissionStatus.UNDETERMINED && perm.canAskAgain) {
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (perm.status !== Location.PermissionStatus.GRANTED) return;
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled && pos) {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch {
        // location is optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return coords;
}

/** Great-circle distance in km. */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
