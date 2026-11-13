/**
 * Tags of monuments (filters, category badges). The tags and popularity of every object come from
 * the backend (`monuments.tags`, `monuments.popularity`) and are stored in the local DB.
 */

export const MONUMENT_TAG_IDS = [
  'top',
  'museums',
  'memorials',
  'nature',
  'architecture',
  'parks',
  'history',
  'religion',
  'sport',
  'culture',
] as const;

export type MonumentTagId = (typeof MONUMENT_TAG_IDS)[number];

/** SF Symbol and colour of a tag badge. */
export const TAG_STYLE: Record<MonumentTagId, { icon: string; color: string }> = {
  top: { icon: 'star.fill', color: '#FF9500' },
  museums: { icon: 'building.columns.fill', color: '#AF52DE' },
  memorials: { icon: 'flame.fill', color: '#FF3B30' },
  nature: { icon: 'leaf.fill', color: '#34C759' },
  architecture: { icon: 'building.2.fill', color: '#007AFF' },
  parks: { icon: 'tree.fill', color: '#30B0C7' },
  history: { icon: 'clock.fill', color: '#A2845E' },
  religion: { icon: 'moon.stars.fill', color: '#5856D6' },
  sport: { icon: 'figure.run', color: '#FF2D55' },
  culture: { icon: 'theatermasks.fill', color: '#FF6482' },
};

/** The main category of an object: its first tag other than "top". */
export function mainTag(tags: string[]): MonumentTagId | null {
  const tag = tags.find((x) => x !== 'top' && x in TAG_STYLE);
  return (tag as MonumentTagId | undefined) ?? null;
}
