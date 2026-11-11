import { mapSelection } from '@/src/storage/mapSelection';
import type { Href, useRouter } from 'expo-router';

/** Place that was shown in the sheet when another screen was opened over the map. */
let restoreId: string | null = null;
let openedAt = 0;
/** A focus this soon after opening is the sheet closing itself, not the user coming back. */
const MIN_AWAY_MS = 500;

/**
 * Opens a screen from the map or from the place sheet. A screen pushed while the sheet is up would
 * open inside it, so the sheet is dismissed in the same step: it slides away and the screen opens
 * full size over the map. The place is remembered, so `restoreSheetAfterReturn` can bring the sheet
 * back when the user comes back (like Apple Maps).
 */
export function openOverSheet(router: ReturnType<typeof useRouter>, href: Href): void {
  const { sheetOpen, selectedId } = mapSelection.get();
  if (sheetOpen) {
    restoreId = selectedId;
    openedAt = Date.now();
    router.back();
  }
  router.push(href);
}

/** Map screen focus handler: reopens the sheet when the user comes back from that screen. */
export function restoreSheetAfterReturn(): void {
  if (restoreId && Date.now() - openedAt > MIN_AWAY_MS) {
    const id = restoreId;
    restoreId = null;
    mapSelection.select(id);
  }
}
