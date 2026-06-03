type CacheClearListener = () => void;

const listeners = new Set<CacheClearListener>();

export function onMonumentCacheCleared(listener: CacheClearListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyMonumentCacheCleared(): void {
  for (const listener of listeners) {
    listener();
  }
}
