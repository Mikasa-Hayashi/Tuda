/**
 * Tags and popularity for monument list filters (source of truth for DB sync).
 */

export const MONUMENT_TAG_IDS = [
  'top',
  'museums',
  'memorials',
  'nature',
  'architecture',
  'parks',
  'history',
] as const;

export type MonumentTagId = (typeof MONUMENT_TAG_IDS)[number];

export type MonumentFilterEntry = {
  tags: MonumentTagId[];
  popularity: number;
};

/** Seeded monument ids — keep in sync with seed.ts */
export const monumentFilterMeta: Record<string, MonumentFilterEntry> = {
  'motherland-calls': { tags: ['top', 'memorials', 'architecture', 'history'], popularity: 100 },
  'lysaya-gora-memorial': { tags: ['memorials', 'nature', 'history'], popularity: 72 },
  'military-train': { tags: ['memorials', 'history', 'museums'], popularity: 68 },
  'first-tram-monument': { tags: ['history', 'museums'], popularity: 45 },
  'volgograd-amphitheatre': { tags: ['architecture', 'nature', 'top'], popularity: 78 },
  'russia-my-history-park': { tags: ['museums', 'parks', 'top'], popularity: 85 },
};
