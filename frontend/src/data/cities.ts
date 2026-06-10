export type City = {
  id: string;
  lat: number;
  lon: number;
};

export const CITIES: City[] = [
  { id: 'maykop', lat: 44.6097, lon: 40.1005 },
  { id: 'astrakhan', lat: 46.3497, lon: 48.0408 },
  { id: 'volgograd', lat: 48.7080, lon: 44.5133 },
  { id: 'elista', lat: 46.3086, lon: 44.2684 },
  { id: 'krasnodar', lat: 45.0446, lon: 38.9760 },
  { id: 'rostov-on-don', lat: 47.2357, lon: 39.7015 },
  { id: 'sevastopol', lat: 44.6054, lon: 33.5224 },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findClosestCity(lat: number, lon: number, maxDistanceKm = 600): string | null {
  let closest: string | null = null;
  let minDist = Infinity;
  for (const city of CITIES) {
    const d = haversineKm(lat, lon, city.lat, city.lon);
    if (d < minDist) {
      minDist = d;
      closest = city.id;
    }
  }
  return minDist <= maxDistanceKm ? closest : null;
}
