import type { ImageProps } from 'expo-image';

/** Framing for the current cover photos, shared by cards and scan results. */
export const MONUMENT_IMAGE_POSITIONS: Record<string, ImageProps['contentPosition']> = {
  sevastopol_05: { top: '50%', left: '50%' },
  volgograd_02: { top: '25%', left: '50%' },
};
