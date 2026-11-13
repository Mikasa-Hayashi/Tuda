import type { TFunction } from 'i18next';

/** "12,3 MB" / "480 KB" with the unit names of the current language. */
export function formatBytes(bytes: number, t: TFunction): string {
  if (bytes < 1024) return `${bytes} ${t('offline.b')}`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ${t('offline.kb')}`;
  return `${(bytes / 1024 / 1024).toFixed(1)} ${t('offline.mb')}`;
}
