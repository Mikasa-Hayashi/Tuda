import { SymbolIcon } from '@/src/components/ListGroup';
import { useTheme } from '@/src/theme/ThemeContext';
import { NativeTabs } from 'expo-router/native-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type IconProps = React.ComponentProps<typeof SymbolIcon>;

/**
 * Content of the system bottom accessory (iOS 26 glass capsule above the tab bar) as a single
 * accent-colored action. The capsule itself is drawn by the system; we only provide what's inside.
 * `regular` = full capsule above the tab bar, `inline` = compact, when the tab bar is minimized.
 */
export function ActionAccessory({
  label,
  sf,
  fallback,
  onPress,
}: {
  label: string;
  sf: IconProps['sf'];
  fallback: IconProps['fallback'];
  onPress: () => void;
}) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <SymbolIcon sf={sf} fallback={fallback} size={18} color="#FFFFFF" />
      {placement === 'regular' && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    // Fill the whole system capsule with the accent color; the large radius keeps it pill-shaped
    // even if the system container doesn't clip its content.
    borderRadius: 999,
  },
  pressed: { opacity: 0.6 },
  label: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
