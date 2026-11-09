import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
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
 * title. Declared here (not inside the screens) so the native header exists from the first frame.
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

// TEMP diagnostics for the back button that stops responding on the 2nd visit to settings.
const logNav = (name: string) => (e: { target?: string; data?: unknown }) =>
  console.log(`[nav] ${name}`, e.target, JSON.stringify(e.data ?? null));

function RootStack() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const settingsHeader = useNativeHeader(t('settings.title'));

  // React Navigation paints its own background behind screens (visible as white edges during
  // the swipe-back gesture and as a flash while a screen closes). Tie it to our theme.
  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.separator,
        primary: colors.primary,
      },
    };
  }, [isDark, colors.background, colors.text, colors.separator, colors.primary]);

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        initialRouteName="index"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
        screenListeners={{
          focus: logNav('focus'),
          blur: logNav('blur'),
          beforeRemove: logNav('beforeRemove'),
          transitionStart: logNav('transitionStart'),
          transitionEnd: logNav('transitionEnd'),
          gestureCancel: logNav('gestureCancel'),
        }}
      >
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
    </NavThemeProvider>
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
