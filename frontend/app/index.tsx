import { getOnboardingDone } from '@/src/storage/citySelection';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';

export default function EntryGateScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const run = async () => {
      const done = await getOnboardingDone();
      router.replace(done ? '/overview' : '/select-city');
    };
    run();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
