import {
  getMonumentById,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import type { Monument } from '@/src/db/monumentRepository';
import { fetchMonumentDetail } from '@/src/services/monumentsApi';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  LabeledContent,
  RNHostView,
  Section,
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
  lineLimit,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  preferredColorScheme,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const CLEAR = '#00000000';
/** Form rows are inset by the system's grouped-list margin on each side. */
const FORM_MARGIN = 16;
const COLLAPSED_LINES = 5;
const LONG_DESCRIPTION = 200;

export default function MonumentDetailScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const [descExpanded, setDescExpanded] = useState(false);
  const [monument, setMonument] = useState<Monument | null>(() =>
    getMonumentById(id ?? '', i18n.language),
  );
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (monument?.name) return;
    fetchMonumentDetail(id ?? '')
      .then((detail) => {
        upsertMonumentTranslationsFromApi(detail.translations);
        if (detail.field_configs?.length) {
          upsertMonumentFieldConfigsFromApi(detail.field_configs);
        }
        setMonument(getMonumentById(id ?? '', i18n.language));
      })
      .catch(() => {})
      .finally(() => setFetchDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, i18n.language]);

  // Spinner while the monument isn't cached and the detail request is still in flight.
  const isFetching = !monument && !fetchDone;
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const heroWidth = width - FORM_MARGIN * 2;
  const heroHeight = Math.round((heroWidth * 3) / 4);

  if (!monument) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        {isFetching && <ActivityIndicator size="large" />}
      </View>
    );
  }

  const hasMore = monument.description.length > LONG_DESCRIPTION;

  const shareMonument = () =>
    Share.share({
      message: monument.location ? `${monument.name} — ${monument.location}` : monument.name,
    }).catch(() => {});

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={shareMonument} />
      </Stack.Toolbar>

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          <Form>
            {/* Cover */}
            <Section>
              <HStack
                modifiers={[
                  listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
                  listRowBackground(CLEAR),
                ]}
              >
                <RNHostView matchContents>
                  <Image
                    source={monument.imageUrl ? { uri: monument.imageUrl } : undefined}
                    style={{
                      width: heroWidth,
                      height: heroHeight,
                      borderRadius: 20,
                      backgroundColor: colors.cardElevated,
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </RNHostView>
              </HStack>
            </Section>

            {/* Title, address, description */}
            <Section>
              <VStack
                alignment="leading"
                spacing={8}
                modifiers={[
                  frame({ maxWidth: 10000, alignment: 'leading' }),
                  listRowBackground(CLEAR),
                  listRowSeparator('hidden'),
                ]}
              >
                <Text modifiers={[font({ textStyle: 'title', weight: 'bold' })]}>
                  {monument.name}
                </Text>
                {monument.location ? (
                  <HStack spacing={5}>
                    <SymbolImage
                      systemName="mappin.and.ellipse"
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                      ]}
                    >
                      {monument.location}
                    </Text>
                  </HStack>
                ) : null}
                {monument.description ? (
                  <Text
                    modifiers={[
                      font({ textStyle: 'body' }),
                      foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                      descExpanded || !hasMore ? lineLimit() : lineLimit(COLLAPSED_LINES),
                    ]}
                  >
                    {monument.description}
                  </Text>
                ) : null}
                {hasMore && !descExpanded && (
                  <Button
                    label={t('info.readMore')}
                    onPress={() => setDescExpanded(true)}
                    modifiers={[buttonStyle('borderless')]}
                  />
                )}
              </VStack>
            </Section>

            {/* Architecture details */}
            {monument.details.length > 0 && (
              <Section title={t('info.architectureDetails')}>
                {monument.details.map((item, i) => (
                  <LabeledContent key={`d-${i}`} label={t(item.labelKey)}>
                    <Text>{item.value ?? '—'}</Text>
                  </LabeledContent>
                ))}
              </Section>
            )}

            {/* Tourism info */}
            {monument.visitors.length > 0 && (
              <Section title={t('info.tourismInfo')}>
                {monument.visitors.map((item, i) => (
                  <LabeledContent key={`v-${i}`} label={t(item.labelKey)}>
                    <Text>{item.value ?? '—'}</Text>
                  </LabeledContent>
                ))}
              </Section>
            )}

            {/* Quiz */}
            <Section>
              <Button
                label={t('info.play_quiz')}
                systemImage="trophy"
                onPress={() =>
                  router.push({
                    pathname: '/quiz',
                    params: { id: monument.id, name: monument.name },
                  })
                }
              />
            </Section>

            {/* Transparent spacer row: lets the last row scroll clear of the floating button. */}
            <Section>
              <Spacer
                modifiers={[
                  frame({ height: 72 }),
                  listRowBackground(CLEAR),
                  listRowSeparator('hidden'),
                ]}
              />
            </Section>
          </Form>
        </Host>

        {/* Floating glass audio-guide button over the list. */}
        <View
          pointerEvents="box-none"
          style={[styles.floating, { bottom: (initialWindowMetrics?.insets.bottom ?? 0) + 8 }]}
        >
          <Host style={styles.audioHost} modifiers={[scheme]}>
            <Button
              label={t('info.audioGuide')}
              systemImage="headphones"
              onPress={() =>
                router.push({
                  pathname: '/audio-guide',
                  params: { id: monument.id, name: monument.name },
                })
              }
              modifiers={[
                buttonStyle('glassProminent'),
                controlSize('large'),
                frame({ maxWidth: 10000 }),
              ]}
            />
          </Host>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  floating: { position: 'absolute', left: 20, right: 20 },
  audioHost: { height: 52 },
});
