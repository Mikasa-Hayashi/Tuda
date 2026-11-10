import { getOnboardingDone } from '@/src/storage/citySelection';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Entry route. The visible splash is the native launch screen (configured in app.json via the
 * expo-splash-screen plugin and held by SplashScreen.preventAutoHideAsync in _layout.tsx).
 * This screen only decides where to go, then releases the native splash.
 */
export default function Entry() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      const done = await getOnboardingDone();
      if (cancelled) return;
      if (done) router.replace('/overview');
      else router.replace({ pathname: '/select-city', params: { onboarding: '1' } });
      // Let the target screen mount a frame before the native splash fades out.
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
    };
    go();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Same color as the native splash, in case a frame is visible before it hides.
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#007AFF' },
});
