import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../src/i18n/i18n';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { setupDatabase } from '../src/db/dbInit';

setupDatabase();

/**
 * Pushed iOS screens: transparent header with the system glass back button and a small centered
 * title. Declared here (not inside the screens) so the native header exists from the first frame;
 * toggling headerShown from inside a screen made the back button stop responding after one use.
 */
function useNativeHeader(title: string) {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      headerShown: true,
      title,
      headerTransparent: true,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal' as const,
      headerTintColor: colors.text,
      headerTitleStyle: { color: colors.text },
    }),
    [title, colors.text],
  );
}

function RootStack() {
  const { t } = useTranslation();
  const settingsHeader = useNativeHeader(t('settings.title'));

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="select-city"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ gestureEnabled: false, animationTypeForReplace: 'pop' }}
      />
      <Stack.Screen name="info" />
      <Stack.Screen name="route-info" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="settings" options={settingsHeader} />
      <Stack.Screen name="menu" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
