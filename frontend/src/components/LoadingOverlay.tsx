import { Host, ProgressView, Text, VStack } from '@expo/ui/swift-ui';
import { font, glassEffect, padding } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type LoadingOverlayProps = {
  visible: boolean;
  text?: string;
};

/**
 * Full-screen "busy" HUD: a native SwiftUI ProgressView on a Liquid Glass card. Rendered in
 * place (not in a <Modal>) so it can never get stuck above native screen transitions; the
 * dimming layer swallows touches while visible.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="auto" accessibilityViewIsModal>
      <Host matchContents>
        <VStack
          spacing={12}
          modifiers={[
            padding({ horizontal: 28, vertical: 22 }),
            glassEffect({
              glass: { variant: 'regular' },
              shape: 'roundedRectangle',
              cornerRadius: 24,
            }),
          ]}>
          <ProgressView />
          {text ? <Text modifiers={[font({ size: 15, weight: 'medium' })]}>{text}</Text> : null}
        </VStack>
      </Host>
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
});
