import { ActionAccessory } from '@/src/components/ActionAccessory';
import { useRouter } from 'expo-router';
import React from 'react';

/** Bottom accessory of the Routes tab: opens the AI route builder. */
export function AiRouteAccessory({ label }: { label: string }) {
  const router = useRouter();
  return (
    <ActionAccessory
      label={label}
      sf="sparkles"
      fallback="sparkles"
      onPress={() => router.push('/ai-route')}
    />
  );
}
