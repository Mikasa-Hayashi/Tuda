import React from 'react';
import { ActivityIndicator, PlatformColor, StyleSheet, Text, View } from 'react-native';

type LoadingOverlayProps = {
  visible: boolean;
  text?: string;
};

/**
 * Full-screen "busy" HUD. Rendered in place (not in a <Modal>) so it can never get stuck
 * above native screen transitions; it swallows touches while visible.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="auto" accessibilityViewIsModal>
      <View style={styles.box}>
        <ActivityIndicator size="large" />
        {text ? <Text style={styles.text}>{text}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  box: {
    minWidth: 120,
    paddingVertical: 22,
    paddingHorizontal: 26,
    borderRadius: 20,
    gap: 12,
    alignItems: 'center',
    backgroundColor: PlatformColor('secondarySystemBackground'),
  },
  text: { fontSize: 15, fontWeight: '500', color: PlatformColor('label') },
});
