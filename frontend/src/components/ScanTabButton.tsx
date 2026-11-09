import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/src/theme/ThemeContext';

type Props = { label: string };

/** Raised round camera button for the center of the tab bar. Opens /camera. */
export function ScanTabButton({ label }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push('/camera');
        }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="camera" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center' },
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
