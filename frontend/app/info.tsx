import {
  getMonumentById,
  getNearbyMonuments,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import type { Monument } from '@/src/db/monumentRepository';
import { distanceKm, useUserLocation } from '@/src/map/useUserLocation';
import { getOpeningStatus, parseSchedule, type OpeningStatus } from '@/src/utils/openingHours';
import { MAP_PROVIDERS, openPlaceIn, openRouteIn } from '@/src/map/externalMaps';
import { fetchMonumentDetail } from '@/src/services/monumentsApi';
import { BADGE, BadgeLabel } from '@/src/components/BadgeLabel';
import { useAudioGuide } from '@/src/audio/AudioGuideContext';
import { getQuizQuestions } from '@/src/data/quiz';
import { useFavorites } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  DisclosureGroup,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  LabeledContent,
  Menu,
  Spacer,
  RNHostView,
  Section,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  controlSize,
  font,
  foregroundStyle,
  fixedSize,
  frame,
  lineLimit,
  listRowBackground,
  listRowInsets,
  padding,
  listRowSeparator,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const CLEAR = '#00000000';
/** Form rows are inset by the system's grouped-list margin on each side. */
const FORM_MARGIN = 16;
/** Leading indent the system adds to DisclosureGroup content (measured on a 414pt-wide iPhone). */
const DISCLOSURE_INDENT = 20;
const LONG_DESCRIPTION = 200;
const NEARBY_COUNT = 5;

function formatDistance(km: number, t: (key: string) => string): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} ${t('info.unitMeters')}`;
  return `${km.toFixed(1)} ${t('info.unitKm')}`;
}

/** "1.2 km · 15 min on foot" (walking at ~5 km/h). */
function formatFromUser(km: number, t: (key: string) => string): string {
  const minutes = Math.max(1, Math.round((km / 5) * 60));
  const time =
    minutes >= 60
      ? `${Math.floor(minutes / 60)} ${t('info.unitHour')} ${minutes % 60} ${t('info.unitMin')}`
      : `${minutes} ${t('info.unitMin')}`;
  return `${formatDistance(km, t)} · ${time} ${t('info.onFoot')}`;
}

function describeStatus(
  status: OpeningStatus,
  t: (key: string, opts?: Record<string, string>) => string,
  lang: string,
): { text: string; open: boolean } {
  if (status.kind === 'always') return { text: t('info.openAlways'), open: true };
  if (status.kind === 'open')
    return { text: t('info.openUntil', { time: status.closesAt }), open: true };
  if (!status.opensAt) return { text: t('info.closedNow'), open: false };
  let when = status.opensAt;
  if (status.opensDay !== null) {
    // 2024-01-07 is a Sunday, so day index d maps to January 7 + d.
    const dayName = new Date(2024, 0, 7 + status.opensDay).toLocaleDateString(lang, {
      weekday: 'short',
    });
    when = `${dayName} ${status.opensAt}`;
  }
  return { text: t('info.closedOpens', { when }), open: false };
}

export default function MonumentDetailScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const [monument, setMonument] = useState<Monument | null>(() =>
    getMonumentById(id ?? '', i18n.language),
  );
  const [fetchDone, setFetchDone] = useState(false);
  const favorites = useFavorites();
  const audio = useAudioGuide();
  const isFavorite = favorites.isFavorite('monument', id ?? '');
  const userLocation = useUserLocation();

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

  // The quiz entry is shown only for monuments that actually have a quiz.
  const hasQuiz = useMemo(
    () => !!id && getQuizQuestions({ monumentId: id, lang: i18n.language, t }).length > 0,
    [id, i18n.language, t],
  );

  // Closest other monuments (offline, from the local DB).
  const nearby = useMemo(
    () =>
      monument
        ? getNearbyMonuments(monument.lat, monument.lon, 10, i18n.language)
            .filter((m) => m.id !== monument.id)
            .slice(0, NEARBY_COUNT)
        : [],
    [monument, i18n.language],
  );

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

  const schedule = parseSchedule(monument.openingSchedule);
  const openingInfo = schedule
    ? describeStatus(getOpeningStatus(schedule), t, i18n.language)
    : null;
  const isLong = monument.description.length > LONG_DESCRIPTION;
  const target = { lat: monument.lat, lon: monument.lon, name: monument.name };
  const onToggleFavorite = () => {
    void favorites.toggle('monument', monument.id);
  };

  const shareMonument = () =>
    Share.share({
      message: monument.location ? `${monument.name} — ${monument.location}` : monument.name,
    }).catch(() => {});

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isFavorite ? 'heart.fill' : 'heart'}
          onPress={onToggleFavorite}
        />
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={shareMonument} />
        <Stack.Toolbar.Menu icon="map">
          {MAP_PROVIDERS.map((p) => (
            <Stack.Toolbar.MenuAction key={p.id} onPress={() => openRouteIn(p, target)}>
              {p.title}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} modifiers={[scheme]}>
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
                <Text
                  modifiers={[
                    font({ textStyle: 'title', weight: 'bold' }),
                    lineLimit(),
                    fixedSize({ vertical: true }),
                  ]}
                >
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
                        foregroundStyle({
                          type: 'hierarchical',
                          style: 'secondary',
                        }),
                      ]}
                    >
                      {monument.location}
                    </Text>
                  </HStack>
                ) : null}
                {openingInfo ? (
                  <HStack spacing={5}>
                    <SymbolImage
                      systemName="clock"
                      size={14}
                      color={openingInfo.open ? '#34C759' : '#FF3B30'}
                    />
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle({
                          type: 'color',
                          color: openingInfo.open ? '#34C759' : '#FF3B30',
                        }),
                      ]}
                    >
                      {openingInfo.text}
                    </Text>
                  </HStack>
                ) : null}
                {userLocation ? (
                  <HStack spacing={5}>
                    <SymbolImage systemName="figure.walk" size={14} color={colors.textMuted} />
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                      ]}
                    >
                      {formatFromUser(distanceKm(userLocation, monument), t)}
                    </Text>
                  </HStack>
                ) : null}
                {monument.description && !isLong ? (
                  <Text
                    modifiers={[
                      font({ textStyle: 'body' }),
                      foregroundStyle({
                        type: 'hierarchical',
                        style: 'secondary',
                      }),
                    ]}
                  >
                    {monument.description}
                  </Text>
                ) : null}
              </VStack>
            </Section>

            {/* Long description: native disclosure row. Its content is indented by the system, so the
                text is pulled back by that indent to line up with the row title. */}
            {monument.description && isLong ? (
              <Section>
                <DisclosureGroup label={t('info.historyInfo')}>
                  <Text
                    modifiers={[
                      font({ textStyle: 'body' }),
                      foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                      padding({ leading: -DISCLOSURE_INDENT }),
                      frame({ maxWidth: 10000, alignment: 'leading' }),
                      fixedSize({ horizontal: false, vertical: true }),
                    ]}
                  >
                    {monument.description}
                  </Text>
                </DisclosureGroup>
              </Section>
            ) : null}

            {/* Nearby monuments */}
            {nearby.length > 0 && (
              <Section title={t('info.nearby')}>
                {nearby.map((m) => (
                  <Button
                    key={m.id}
                    onPress={() => router.push(`/info?id=${m.id}`)}
                    modifiers={[buttonStyle('plain')]}
                  >
                    {/* contentShape: the whole row is tappable, including the empty space. */}
                    <HStack
                      spacing={8}
                      modifiers={[frame({ maxWidth: 10000 }), contentShape(shapes.rectangle())]}
                    >
                      <Text modifiers={[lineLimit(2)]}>{m.name}</Text>
                      <Spacer />
                      <Text
                        modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}
                      >
                        {formatDistance(m.distanceKm, t)}
                      </Text>
                      <SymbolImage systemName="chevron.right" size={12} color={colors.textMuted} />
                    </HStack>
                  </Button>
                ))}
              </Section>
            )}

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
                <Menu label={t('info.openInMaps')} systemImage="map">
                  {MAP_PROVIDERS.map((p) => (
                    <Button key={p.id} label={p.title} onPress={() => openPlaceIn(p, target)} />
                  ))}
                </Menu>
              </Section>
            )}

            {/* Quiz: shown only when this monument has one */}
            {hasQuiz && (
              <Section>
                <Button
                  onPress={() =>
                    router.push({
                      pathname: '/quiz',
                      params: { id: monument.id, name: monument.name },
                    })
                  }
                >
                  <BadgeLabel
                    title={t('info.play_quiz')}
                    systemImage="trophy.fill"
                    color={BADGE.orange}
                  />
                </Button>
              </Section>
            )}

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
            {audio.track ? (
              // A track is loaded: the capsule is the mini player (tap = open the sheet).
              <Button
                label={audio.track.name}
                systemImage="headphones"
                onPress={() => router.push('/audio-guide')}
                modifiers={[buttonStyle('glass'), controlSize('large'), frame({ maxWidth: 10000 })]}
              />
            ) : (
              <Button
                label={t('info.audioGuide')}
                systemImage="headphones"
                onPress={() => {
                  // The sheet starts playback once it has slid in, so the capsule does not
                  // change abruptly under the presentation animation.
                  router.push({
                    pathname: '/audio-guide',
                    params: {
                      id: monument.id,
                      name: monument.name,
                      image: monument.imageUrl ?? '',
                    },
                  });
                }}
                modifiers={[
                  buttonStyle('glassProminent'),
                  controlSize('large'),
                  frame({ maxWidth: 10000 }),
                ]}
              />
            )}
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
