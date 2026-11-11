import { useAudioGuide } from '@/src/audio/AudioGuideContext';
import { SymbolIcon } from '@/src/components/ListGroup';
import { useTheme } from '@/src/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Mini player inside the system bottom accessory (glass capsule above the tab bar), like Apple
 * Music: tap opens the full player sheet, the button toggles playback.
 */
export function AudioPlayerAccessory({ label }: { label: string }) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const router = useRouter();
  const { colors } = useTheme();
  const { track, isPlaying, toggle } = useAudioGuide();
  if (!track) return null;

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => router.push('/audio-guide')}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <SymbolIcon sf="headphones" fallback="headset" size={18} color={colors.text} />
        {placement === 'regular' && (
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {track.name}
          </Text>
        )}
      </Pressable>
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
  root: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 15, fontWeight: '600' },
  button: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
