import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { SymbolIcon } from '@/src/components/ListGroup';
import { useTheme } from '@/src/theme/ThemeContext';

/**
 * Back button for the native header that pops from JS. The built-in native back button stopped
 * responding on the second visit to a screen (react-native-screens 4.16 on iOS 27); this goes
 * through the router instead. On iOS 26+ UIKit still draws it inside a glass bar item.
 */
export function HeaderBackButton() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={styles.button}
    >
      <SymbolIcon
        sf="chevron.left"
        fallback="chevron-back"
        size={20}
        color={colors.text}
        weight="semibold"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
