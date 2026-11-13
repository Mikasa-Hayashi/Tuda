import {
  audioLang,
  deleteAudio,
  downloadAudio,
  useAudioDownloadState,
} from '@/src/audio/audioFiles';
import { formatTime, useAudioGuide, type AudioTrack } from '@/src/audio/AudioGuideContext';
import { useTransitionDone } from '@/src/hooks/useTransitionDone';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Host,
  HStack,
  Image as SymbolImage,
  Menu,
  ProgressView,
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
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const ART_MAX = 200;

/**
 * Full player, presented as a native sheet. Dismissing the sheet does not stop playback: the
 * mini player (tab-bar accessory / floating capsule) keeps controlling it.
 */
export default function AudioGuideScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
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
  const transitionDone = useTransitionDone();
  useEffect(() => {
    if (!transitionDone || !requested || currentId === requested.monumentId) return;
    start(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionDone, requested?.monumentId, currentId]);

  const track = player.track ?? requested;
  const lang = audioLang(i18n.language);
  const downloadState = useAudioDownloadState(track?.monumentId ?? '', lang);
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
              max={Math.max(player.duration, 1)}
              onValueChange={player.seek}
              onEditingChanged={player.setScrubbing}
            />
            <HStack>
              <Text modifiers={[font({ textStyle: 'caption' }), monospacedDigit(), secondary]}>
                {formatTime(player.position)}
              </Text>
              <Spacer />
              {/* Playback speed: a small menu chip centred between the two times. */}
              <Menu
                label={`${player.speed}×`}
                modifiers={[buttonStyle('bordered'), controlSize('small'), monospacedDigit()]}
              >
                {SPEEDS.map((sp) => (
                  <Button
                    key={sp}
                    label={`${sp}×`}
                    systemImage={sp === player.speed ? 'checkmark' : undefined}
                    onPress={() => player.setSpeed(sp)}
                  />
                ))}
              </Menu>
              <Spacer />
              <Text modifiers={[font({ textStyle: 'caption' }), monospacedDigit(), secondary]}>
                -{formatTime(Math.max(0, player.duration - player.position))}
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

          {/* Download for offline listening; by default the guide streams from the server. */}
          {downloadState === 'downloading' ? (
            <HStack spacing={8}>
              <ProgressView />
              <Text modifiers={[font({ textStyle: 'subheadline' }), secondary]}>
                {t('audioGuide.downloading')}
              </Text>
            </HStack>
          ) : downloadState === 'downloaded' ? (
            <Menu
              label={t('audioGuide.downloaded')}
              systemImage="checkmark.circle.fill"
              modifiers={[buttonStyle('plain'), lineLimit(1)]}
            >
              <Button
                label={t('audioGuide.deleteDownload')}
                systemImage="trash"
                role="destructive"
                onPress={() => deleteAudio(track.monumentId, lang)}
              />
            </Menu>
          ) : (
            <Button
              label={t('audioGuide.download')}
              systemImage="arrow.down.circle"
              onPress={() => {
                void downloadAudio(track.monumentId, lang).then((ok) => {
                  if (!ok) Alert.alert(t('audioGuide.downloadFailed'));
                });
              }}
              modifiers={[buttonStyle('plain'), lineLimit(1)]}
            />
          )}

          <Spacer />

          {/* Stop: a quiet red text button, clearly secondary to the transport controls. */}
          <Button
            label={t('audioGuide.stop')}
            systemImage="xmark.circle"
            onPress={() => {
              player.stop();
              router.back();
            }}
            modifiers={[
              buttonStyle('plain'),
              tint('#FF3B30'),
              foregroundStyle('#FF3B30'),
              lineLimit(1),
            ]}
          />
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
});
