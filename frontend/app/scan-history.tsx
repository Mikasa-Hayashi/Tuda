import CoverImage from '@/src/components/CoverImage';
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
  RNHostView,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
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

/** Past scans as a native list: the photo that was scanned, the best match and how sure the model was. */
export default function ScanHistoryScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const entries = useScanHistory();
  const transitionDone = useTransitionDone();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  // Local DB reads are synchronous: wait for the push animation to finish first.
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
      { text: t('scanResult.historyClear'), style: 'destructive', onPress: scanHistory.clear },
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
      <Stack.Screen options={{ title: t('scanResult.historyTitle') }} />
      {entries.length > 0 && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="trash"
            accessibilityLabel={t('scanResult.historyClear')}
            onPress={confirmClear}
          />
        </Stack.Toolbar>
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          {entries.length === 0 ? (
            <ContentUnavailableView
              title={t('scanResult.historyEmpty')}
              systemImage="clock.arrow.circlepath"
              description={t('scanResult.historyHint')}
            />
          ) : (
            <Form>
              <Section>
                {rows.map(({ entry, name, imageUrl }) => {
                  const source = entry.photoUri ?? imageUrl;
                  return (
                    <Button
                      key={entry.id}
                      onPress={() =>
                        router.push({ pathname: '/info', params: { id: entry.monumentId } })
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
                        <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
                      </HStack>
                    </Button>
                  );
                })}
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
