import CoverImage from '@/src/components/CoverImage';
import { useAudioGuide } from '@/src/audio/AudioGuideContext';
import { getMonumentById } from '@/src/db/monumentRepository';
import { useTransitionDone } from '@/src/hooks/useTransitionDone';
import { scanHistory, useScanHistory, type ScanEntry } from '@/src/storage/scanHistory';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  ContentUnavailableView,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  List,
  RNHostView,
  Section,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  labelStyle,
  font,
  foregroundStyle,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

const THUMB = 56;

type Row = { entry: ScanEntry; name: string; imageUrl: string | null };

/**
 * Scan tab: history of past scans (the photo, the best match and how sure the model was). The
 * "Open camera" action lives in the system bottom accessory (see `(tabs)/_layout.tsx`); while the
 * audio mini player owns that slot it moves to the header.
 */
export default function ScanTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { track } = useAudioGuide();
  const entries = useScanHistory();
  const transitionDone = useTransitionDone();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({
    type: 'hierarchical',
    style: 'secondary',
  });

  // Local DB reads are synchronous: wait for the tab's first render to settle.
  const rows = useMemo<Row[]>(
    () =>
      transitionDone
        ? entries.flatMap((entry) => {
            const m = getMonumentById(entry.monumentId, i18n.language);
            return m ? [{ entry, name: m.name, imageUrl: m.imageUrl || null }] : [];
          })
        : [],
    [entries, transitionDone, i18n.language],
  );

  const confirmClear = () =>
    Alert.alert(t('scanResult.historyClear'), t('scanResult.historyClearHint'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('scanResult.historyClear'),
        style: 'destructive',
        onPress: scanHistory.clear,
      },
    ]);

  const formatDate = (at: number) =>
    new Date(at).toLocaleString(i18n.language, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      <Stack.Title>{t('tabs.scan')}</Stack.Title>
      <Stack.Toolbar placement="right">
        {/* The bottom accessory is taken by the audio mini player: the camera moves to the header. */}
        {track && (
          <Stack.Toolbar.Button
            icon="camera.fill"
            accessibilityLabel={t('scan.button')}
            onPress={() => router.push('/camera')}
          />
        )}
        {entries.length > 0 && (
          <Stack.Toolbar.Menu icon="ellipsis.circle">
            <Stack.Toolbar.MenuAction icon="trash" destructive onPress={confirmClear}>
              {t('scanResult.historyClear')}
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        )}
      </Stack.Toolbar>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          {entries.length === 0 ? (
            <ContentUnavailableView
              title={t('scanResult.historyEmpty')}
              systemImage="camera.viewfinder"
              description={t('scan.desc')}
            />
          ) : (
            <Form>
              <Section title={t('scanResult.historyTitle')}>
                <List.ForEach data={rows} keyExtractor={(r) => r.entry.id} recycling={false}>
                  {({ item: { entry, name, imageUrl } }) => {
                    const source = entry.photoUri ?? imageUrl;
                    return (
                      <SwipeActions>
                        <Button
                          onPress={() =>
                            router.push({
                              pathname: '/info',
                              params: { id: entry.monumentId },
                            })
                          }
                          modifiers={[buttonStyle('plain')]}
                        >
                          <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
                            <RNHostView matchContents>
                              <CoverImage
                                source={source ? { uri: source } : undefined}
                                style={{
                                  width: THUMB,
                                  height: THUMB,
                                  borderRadius: 12,
                                  backgroundColor: colors.cardElevated,
                                }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                              />
                            </RNHostView>
                            <VStack alignment="leading" spacing={2}>
                              <Text modifiers={[font({ textStyle: 'headline' })]}>{name}</Text>
                              <HStack spacing={5}>
                                <SymbolImage
                                  systemName={
                                    entry.recognized ? 'checkmark.seal.fill' : 'questionmark.circle'
                                  }
                                  size={13}
                                  color={entry.recognized ? '#34C759' : '#FF9F0A'}
                                />
                                <Text modifiers={[font({ textStyle: 'subheadline' }), secondary]}>
                                  {`${Math.round(entry.confidence * 100)}% · ${formatDate(entry.at)}`}
                                </Text>
                              </HStack>
                            </VStack>
                            <Spacer />
                            <SymbolImage
                              systemName="chevron.right"
                              size={12}
                              modifiers={[secondary]}
                            />
                          </HStack>
                        </Button>
                        <SwipeActions.Actions edge="trailing" allowsFullSwipe>
                          <Button
                            label={t('scanResult.historyRemove')}
                            systemImage="trash"
                            role="destructive"
                            onPress={() => scanHistory.remove(entry.id)}
                          modifiers={[labelStyle('iconOnly')]}
                          />
                        </SwipeActions.Actions>
                      </SwipeActions>
                    );
                  }}
                </List.ForEach>
              </Section>
            </Form>
          )}
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
