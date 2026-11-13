import { ActionAccessory } from '@/src/components/ActionAccessory';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';

/** Bottom accessory of the Scan tab: opens the camera. */
export function ScanCameraAccessory({ label }: { label: string }) {
  const router = useRouter();
  return (
    <ActionAccessory
      label={label}
      sf="camera.fill"
      fallback="camera"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push('/camera');
      }}
    />
  );
}
