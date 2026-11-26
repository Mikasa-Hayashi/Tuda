import { getOnboardingDone } from '@/src/storage/citySelection';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Entry route. The visible splash is the native launch screen (configured in app.json via the
 * expo-splash-screen plugin and held by SplashScreen.preventAutoHideAsync in _layout.tsx).
 * The same logo covers the transition on platforms that show the entry route.
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

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash-icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  logo: { width: 180, height: 180 },
});
