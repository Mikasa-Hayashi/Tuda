import { useMemo } from 'react';

import { useTheme } from '@/src/theme/ThemeContext';

/**
 * Options for a pushed iOS screen: transparent header with the system glass back button and a
 * small centered title (large titles are for root screens only). The object is memoized because
 * a new one on every render reconfigures the native header and can swallow back-button taps.
 */
export function useNativeHeader(title: string) {
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
