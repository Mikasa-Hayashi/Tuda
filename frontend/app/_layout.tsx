import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AudioGuideProvider } from '../src/audio/AudioGuideContext';
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
        <Stack.Screen
          name="camera"
          options={{
            ...detailScreenOptions,
            // Slides up from the bottom like a sheet; swipe down or the ✕ button closes it.
            presentation: 'modal',
            headerBackVisible: false,
            title: t('scan.title'),
            headerTransparent: true,
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF' },
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            presentation: 'formSheet',
            headerShown: true,
            sheetAllowedDetents: [1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="scan-result"
          options={({ route }) => ({
            // Result card over the camera: a native detent sheet. The list of candidates is short,
            // so it opens at half height instead of leaving a big empty area.
            presentation: 'formSheet',
            headerShown: false,
            sheetAllowedDetents: (route.params as { alt?: string } | undefined)?.alt
              ? [0.5, 1]
              : [0.72, 1],
            sheetGrabberVisible: true,
          })}
        />
        <Stack.Screen
          name="image-viewer"
          options={{
            // Zoom transition from the tapped photo; transparent header keeps the system back button.
            title: '',
            headerBackVisible: false,
            headerTransparent: true,
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen
          name="quiz"
          options={({ route }) => ({
            ...detailScreenOptions,
            title: (route.params as { name?: string } | undefined)?.name || t('quiz.title'),
          })}
        />
        <Stack.Screen name="settings" options={settingsHeader} />
        {/* Opaque header (like about/info): a transparent one made the native Form shift once its top inset was measured. */}
        <Stack.Screen
          name="favorites"
          options={{ ...detailScreenOptions, title: t('favorites.title') }}
        />
        <Stack.Screen name="menu" options={{ title: t('tabs.home') }} />
        <Stack.Screen name="about" options={{ ...detailScreenOptions, title: t('about.title') }} />
        <Stack.Screen
          name="ai-route"
          options={{ ...detailScreenOptions, title: t('aiRoute.title') }}
        />
        <Stack.Screen
          name="place"
          options={{
            // Apple-Maps-style place sheet: the map stays interactive behind the lower detents.
            presentation: 'formSheet',
            headerShown: false,
            sheetAllowedDetents: [0.3, 0.62, 1],
            sheetInitialDetentIndex: 0,
            sheetLargestUndimmedDetentIndex: 1,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="audio-guide"
          options={{
            title: t('info.audioGuide'),
            // Native player sheet; dismissing it leaves the mini player running.
            presentation: 'formSheet',
            headerShown: false,
            sheetAllowedDetents: [0.78, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AudioGuideProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootStack />
        </GestureHandlerRootView>
      </AudioGuideProvider>
    </ThemeProvider>
  );
}
