import { useAudioGuide } from '@/src/audio/AudioGuideContext';
import { SymbolIcon } from '@/src/components/ListGroup';
import { useTheme } from '@/src/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ContextMenu,
  Host,
  HStack,
  Image as SymbolImage,
  Spacer,
  Text as SwiftText,
} from '@expo/ui/swift-ui';
import {
  contentShape,
  font,
  frame,
  lineLimit,
  onTapGesture,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

/**
 * Mini player inside the system bottom accessory (glass capsule above the tab bar), like Apple
 * Music: tap opens the full player sheet, the button toggles playback, a long press opens a native
 * dropdown with one action (stop). The capsule fills from the left as the guide is listened to.
 */
export function AudioPlayerAccessory({ label }: { label: string }) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { track, isPlaying, toggle, position, duration, stop } = useAudioGuide();

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const [fill] = useState(() => new Animated.Value(0));
  useEffect(() => {
    // Position arrives every 250 ms; a linear tween of the same length keeps the fill smooth.
    Animated.timing(fill, {
      toValue: progress,
      duration: progress === 0 ? 0 : 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progress, fill]);

  if (!track) return null;

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
      <Host style={styles.menuHost}>
        <ContextMenu>
          <ContextMenu.Items>
            <Button
              label={t('audioGuide.stop')}
              systemImage="stop.circle"
              role="destructive"
              onPress={stop}
            />
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <HStack
              spacing={10}
              modifiers={[
                frame({ maxWidth: 10000, minHeight: 44, alignment: 'leading' }),
                contentShape(shapes.rectangle()),
                onTapGesture(() => router.push('/audio-guide')),
              ]}
            >
              <SymbolImage systemName="headphones" size={18} />
              {placement === 'regular' && (
                <SwiftText modifiers={[font({ size: 15, weight: 'semibold' }), lineLimit(1)]}>
                  {track.name}
                </SwiftText>
              )}
              <Spacer />
            </HStack>
          </ContextMenu.Trigger>
          {/* A compact preview instead of the default lift of the whole capsule, which showed the
              track title twice (the original and its enlarged copy). */}
          <ContextMenu.Preview>
            <HStack spacing={10} modifiers={[padding({ all: 16 })]}>
              <SymbolImage systemName="headphones" size={22} />
              <SwiftText modifiers={[font({ size: 17, weight: 'semibold' })]}>{track.name}</SwiftText>
            </HStack>
          </ContextMenu.Preview>
        </ContextMenu>
      </Host>
      <Pressable
        accessibilityRole="button"
        onPress={toggle}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <SymbolIcon
          sf={isPlaying ? 'pause.fill' : 'play.fill'}
          fallback={isPlaying ? 'pause' : 'play'}
          size={20}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.22 },
  root: { flex: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  menuHost: { flex: 1, alignSelf: 'stretch' },
  button: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
