const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

export type ApiMonument = {
  id: string;
  city_id: string;
  lat: number;
  lon: number;
  image_url: string;
  sort_order: number;
  tags?: string[];
  popularity?: number;
  translations?: ApiMonumentTranslation[];
};

export type ApiMonumentTranslation = {
  monument_id: string;
  lang: string;
  field_key: string;
  field_value: string;
};

export type ApiMonumentFieldConfig = {
  monument_id: string;
  section: 'details' | 'visitors';
  order_index: number;
  label_key: string;
  field_key: string | null;
  static_value: string | null;
};

export type ApiRoute = {
  id: string;
  cover_monument_id: string | null;
  sort_order: number;
};

export type ApiRouteStop = {
  route_id: string;
  monument_id: string;
  order_index: number;
};

export type ApiRouteTranslation = {
  route_id: string;
  lang: string;
  name: string;
  description: string;
};

export type SyncPayload = {
  monuments: ApiMonument[];
  monument_translations: ApiMonumentTranslation[];
  monument_field_configs: ApiMonumentFieldConfig[];
  routes: ApiRoute[];
  route_stops: ApiRouteStop[];
  route_translations: ApiRouteTranslation[];
  deleted_ids: {
    monuments: string[];
    routes: string[];
  };
};

export type ApiMonumentDetail = {
  id: string;
  city_id: string;
  lat: number;
  lon: number;
  image_url: string;
  sort_order: number;
  translations: ApiMonumentTranslation[];
  field_configs: ApiMonumentFieldConfig[];
};

type ApiSearchItem = {
  id: string;
  name: string;
  image_url: string;
  lat: number;
  lon: number;
};

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  return `${API_BASE_URL}${path}?${searchParams.toString()}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchMonumentCountsByCity(): Promise<Record<string, number>> {
  const response = await fetch(`${API_BASE_URL}/monuments/counts`);
  return readJson<Record<string, number>>(response);
}

export async function syncCityData(cityId: string, sinceIso: string): Promise<SyncPayload> {
  const url = buildUrl('/sync/', { city_id: cityId, since: sinceIso });
  const response = await fetch(url);
  return readJson<SyncPayload>(response);
}

export async function downloadCityData(cityId: string): Promise<SyncPayload> {
  return syncCityData(cityId, '1970-01-01T00:00:00.000Z');
}

export async function fetchMonumentsPage(
  cityId: string,
  limit: number,
  offset: number,
): Promise<ApiMonument[]> {
  const url = buildUrl('/monuments', { city_id: cityId, limit, offset });
  const response = await fetch(url);
  return readJson<ApiMonument[]>(response);
}

export async function fetchMonumentDetail(monumentId: string): Promise<ApiMonumentDetail> {
  const response = await fetch(`${API_BASE_URL}/monuments/${encodeURIComponent(monumentId)}`);
  return readJson<ApiMonumentDetail>(response);
}

export async function searchMonumentsRemote(
  cityId: string,
  query: string,
  lang: string,
  limit = 20,
): Promise<ApiSearchItem[]> {
  const url = buildUrl('/monuments/search', { city_id: cityId, q: query, lang, limit });
  const response = await fetch(url);
  return readJson<ApiSearchItem[]>(response);
}

export type AiRouteParams = {
  cityId: string | null;
  lang: string;
  time: 'couple' | 'half' | 'full';
  age: 'kids' | 'adults' | 'family';
  topics: string[];
};

export type AiRouteResult = { monumentIds: string[]; summary: string };

/** Asks the backend (GigaChat) to pick and order stops. Throws if AI is unavailable. */
export async function fetchAiRoute(params: AiRouteParams): Promise<AiRouteResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${API_BASE_URL}/ai-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city_id: params.cityId,
        lang: params.lang,
        time: params.time,
        age: params.age,
        topics: params.topics,
      }),
      signal: controller.signal,
    });
    const data = await readJson<{ monument_ids: string[]; summary: string }>(response);
    return { monumentIds: data.monument_ids, summary: data.summary };
  } finally {
    clearTimeout(timer);
  }
}

export type PackSize = { count: number; bytes: number };
export type PackManifest = {
  places: PackSize;
  routes: PackSize;
  quizzes: PackSize;
  audio: Record<string, PackSize>;
};

/** Sizes of a city's downloadable packs (shown before downloading). */
export async function fetchPackManifest(cityId: string): Promise<PackManifest> {
  const response = await fetch(`${API_BASE_URL}/packs/${encodeURIComponent(cityId)}`);
  return readJson<PackManifest>(response);
}
