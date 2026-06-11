import { getOnboardingDone } from '@/src/storage/citySelection';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const done = await getOnboardingDone();
      router.replace(done ? '/overview' : '/select-city');
    }, 800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.logo}>▲</Text>
      <Text style={styles.title}>Туда</Text>
      <Text style={styles.subtitle}>путеводитель офлайн</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8782A',
  },
  logo: { fontSize: 64, color: '#FFFFFF', lineHeight: 72 },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -0.75,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
