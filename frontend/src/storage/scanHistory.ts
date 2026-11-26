import { useMemo } from 'react';
import { personalData, usePersonalData } from './personalData';
import { MAX_SCAN_ENTRIES, personalEntryId, type ScanRecord } from './personalDataTypes';
import { saveScanPhoto, scanPhotoUri } from './scanPhotos';

export type ScanEntry = ScanRecord & { photoUri: string | null };

export const scanHistory = {
  record: (input: Omit<ScanRecord, 'id' | 'at'> & { photoUri?: string }) => {
    const at = Date.now();
    const id = personalEntryId(at);
    const { photoUri, ...result } = input;
    if (photoUri) saveScanPhoto(photoUri, id);
    const next = [{ ...result, id, at }, ...personalData.get().scans];
    void personalData.set('scans', next.slice(0, MAX_SCAN_ENTRIES));
  },
  remove: (id: string) => {
    const entries = personalData.get().scans;
    void personalData.set('scans', entries.filter((entry) => entry.id !== id));
  },
  clear: () => {
    void personalData.set('scans', []);
  },
};

export function useScanHistory(): ScanEntry[] {
  const scans = usePersonalData('scans');
  return useMemo(() => scans.map((scan) => ({ ...scan, photoUri: scanPhotoUri(scan.id) })), [scans]);
}
