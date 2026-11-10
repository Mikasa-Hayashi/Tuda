import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../src/i18n/i18n';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { setupDatabase } from '../src/db/dbInit';

setupDatabase();

// Keep the native launch screen up until app/index.tsx has decided where to go.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

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

/** Detail screens (monument, route): system header with just the glass back button. */
const detailScreenOptions = {
  headerShown: true,
  title: '',
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
};

// TEMP diagnostics for the back button that stops responding on the 2nd visit to settings.
const logNav = (name: string) => (e: { target?: string; data?: unknown }) =>
  console.log(`[nav] ${name}`, e.target, JSON.stringify(e.data ?? null));

function RootStack() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const settingsHeader = useNativeHeader(t('settings.title'));
  const favoritesHeader = useNativeHeader(t('favorites.title'));

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
          transitionStart: logNav('transitionStart'),
          transitionEnd: logNav('transitionEnd'),
          gestureCancel: logNav('gestureCancel'),
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="select-city"
          options={({ route }) => {
            // First launch (onboarding) is a full-height sheet that can't be swiped away.
            const onboarding =
              (route.params as { onboarding?: string } | undefined)?.onboarding === '1';
            return {
              presentation: 'formSheet',
              headerShown: true,
              // Single full-height detent: partial detents float as an inset card on iOS 26
              // (gap at the bottom) and SwiftUI rows didn't take taps there.
              sheetAllowedDetents: [1],
              sheetGrabberVisible: !onboarding,
              gestureEnabled: !onboarding,
            };
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false,
            animationTypeForReplace: 'pop',
            // Shown in the back button's long-press history; without it iOS prints "(tabs)".
            title: t('tabs.home'),
          }}
        />
        <Stack.Screen name="info" options={detailScreenOptions} />
        <Stack.Screen name="route-info" options={detailScreenOptions} />
        <Stack.Screen name="camera" options={{ title: t('scan.title') }} />
        <Stack.Screen name="quiz" options={{ title: t('quiz.title') }} />
        <Stack.Screen name="settings" options={settingsHeader} />
        <Stack.Screen name="favorites" options={favoritesHeader} />
        <Stack.Screen name="menu" options={{ title: t('tabs.home') }} />
        <Stack.Screen name="about" options={{ title: t('about.title') }} />
        <Stack.Screen name="ai-route" options={{ title: t('routesScreen.aiPromoTitle') }} />
        <Stack.Screen name="audio-guide" options={{ title: t('info.audioGuide') }} />
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
