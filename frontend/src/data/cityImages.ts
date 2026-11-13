import { mediaUrl } from '@/src/services/mediaUrl';

/**
 * City cover images for the city picker. Photos live on the server in
 * backend/static/cities/<city_id>.jpg (see photo credits in backend/static/Monuments/photo_credits.json).
 */
const COVERS = [
  'maykop',
  'astrakhan',
  'volgograd',
  'elista',
  'krasnodar',
  'rostov-on-don',
  'sevastopol',
];

export const CITY_IMAGES: Record<string, string> = Object.fromEntries(
  COVERS.map((id) => [id, mediaUrl(`/static/cities/${id}.jpg`)]),
);
