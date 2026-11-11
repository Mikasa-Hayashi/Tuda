import { formatTime, useAudioGuide, type AudioTrack } from '@/src/audio/AudioGuideContext';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Host,
  HStack,
  Image as SymbolImage,
  Menu,
  RNHostView,
  Slider,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  labelStyle,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  preferredColorScheme,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const ART_MAX = 200;
/** Roughly the length of the sheet presentation animation. */
const PRESENT_MS = 450;

/**
 * Full player, presented as a native sheet. Dismissing the sheet does not stop playback: the
 * mini player (tab-bar accessory / floating capsule) keeps controlling it.
 */
export default function AudioGuideScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const player = useAudioGuide();
  const params = useLocalSearchParams<{ id?: string; name?: string; image?: string }>();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const artSize = Math.min(ART_MAX, width - 160);
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  // Opened from the monument card: show the track right away, but only start playback (which
  // swaps the card's button for the mini player) after the sheet has finished sliding in.
  const requested: AudioTrack | null = params.id
    ? { monumentId: params.id, name: params.name ?? '', imageUrl: params.image || undefined }
    : null;
  const { start } = player; // stable reference
  const currentId = player.track?.monumentId;
  useEffect(() => {
    if (!requested || currentId === requested.monumentId) return;
    const timer = setTimeout(() => start(requested), PRESENT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested?.monumentId, currentId]);

  const track = player.track ?? requested;
  if (!track) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} modifiers={[scheme]}>
        <VStack spacing={0} modifiers={[frame({ maxWidth: 10000, maxHeight: 10000 })]}>
          <Spacer />
          <RNHostView matchContents>
            <Image
              source={track.imageUrl ? { uri: track.imageUrl } : undefined}
              style={{
                width: artSize,
                height: artSize,
                borderRadius: 20,
                backgroundColor: colors.cardElevated,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </RNHostView>

          <Spacer />

          <VStack spacing={4}>
            <Text
              modifiers={[
                font({ textStyle: 'title3', weight: 'bold' }),
                lineLimit(2),
                multilineTextAlignment('center'),
              ]}
            >
              {track.name}
            </Text>
            <Text modifiers={[font({ textStyle: 'subheadline' }), secondary]}>
              {t('audioGuide.voice')}
            </Text>
          </VStack>

          <Spacer />

          <VStack spacing={2} modifiers={[frame({ maxWidth: 10000 })]}>
            <Slider
              value={player.position}
              min={0}
              max={player.duration}
              onValueChange={player.seek}
              onEditingChanged={player.setScrubbing}
            />
            <HStack>
              <Text modifiers={[font({ textStyle: 'caption' }), monospacedDigit(), secondary]}>
                {formatTime(player.position)}
              </Text>
              <Spacer />
              <Text modifiers={[font({ textStyle: 'caption' }), monospacedDigit(), secondary]}>
                -{formatTime(player.duration - player.position)}
              </Text>
            </HStack>
          </VStack>

          <Spacer />

          {/* Transport: skip buttons are icon-only so nothing gets truncated. */}
          <HStack spacing={40}>
            <Button
              label={t('audioGuide.back')}
              systemImage="gobackward.15"
              onPress={() => player.skip(-15)}
              modifiers={[buttonStyle('plain'), labelStyle('iconOnly'), font({ size: 34 })]}
            />
            <Button onPress={player.toggle} modifiers={[buttonStyle('plain')]}>
              <SymbolImage
                systemName={player.isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
                size={80}
                color={colors.primary}
              />
            </Button>
            <Button
              label={t('audioGuide.forward')}
              systemImage="goforward.15"
              onPress={() => player.skip(15)}
              modifiers={[buttonStyle('plain'), labelStyle('iconOnly'), font({ size: 34 })]}
            />
          </HStack>

          <Spacer />

          {/* Secondary actions: two equal glass buttons. */}
          <HStack spacing={12}>
            <Menu
              label={`${player.speed}×`}
              systemImage="speedometer"
              modifiers={[buttonStyle('glass'), controlSize('large'), frame({ maxWidth: 10000 })]}
            >
              {SPEEDS.map((s) => (
                <Button
                  key={s}
                  label={`${s}×`}
                  systemImage={s === player.speed ? 'checkmark' : undefined}
                  onPress={() => player.setSpeed(s)}
                />
              ))}
            </Menu>
            <Button
              label={t('audioGuide.stop')}
              systemImage="xmark"
              onPress={() => {
                player.stop();
                router.back();
              }}
              modifiers={[
                buttonStyle('glass'),
                controlSize('large'),
                tint('#FF3B30'),
                lineLimit(1),
                frame({ maxWidth: 10000 }),
              ]}
            />
          </HStack>
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
});
