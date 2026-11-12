import type { Href } from 'expo-router';

/**
 * Hand-off from the scan-result sheet to the camera screen. A screen pushed while the sheet is
 * still up opens inside it, so the sheet only records where to go and dismisses itself; the camera
 * screen opens the target once it is focused again, i.e. after the sheet has slid away.
 */
let pending: Href | null = null;

export const scanNavigation = {
  set: (href: Href) => {
    pending = href;
  },
  take: (): Href | null => {
    const href = pending;
    pending = null;
    return href;
  },
};
