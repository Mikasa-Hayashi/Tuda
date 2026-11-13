import { CITIES, findClosestCity } from '@/src/data/cities';
import { CITY_IMAGES } from '@/src/data/cityImages';
import {
  applyDeletedFromSync,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import {
  upsertRoutesFromSync,
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
} from '@/src/db/routeRepository';
import { prefetchCityImages } from '@/src/services/imagePrefetch';
import { downloadCityData } from '@/src/services/monumentsApi';
import {
  getDownloadedCityIds,
  getOnboardingDone,
  getSelectedCityId,
  markCityDownloaded,
  setOnboardingDone,
  setSelectedCityId,
} from '@/src/storage/citySelection';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  ProgressView,
  RNHostView,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  controlSize,
  disabled,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowSeparator,
  padding,
  preferredColorScheme,
  shapes,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import { Image as CityImage } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

type CityRowProps = {
  name: string;
  tagline: string;
  imageUri: string | undefined;
  selected: boolean;
  downloaded: boolean;
  downloadState: DownloadState;
  tintColor: string;
  onSelect: () => void;
  onDownload: () => void;
};

const cityImageStyle = {
  width: 64,
  height: 64,
  borderRadius: 16,
  backgroundColor: '#8E8E9333',
} as const;

/** One native SwiftUI list row: tap to choose the city, trailing icon to download it. */
function CityRow({
  name,
  tagline,
  imageUri,
  selected,
  downloaded,
  downloadState,
  tintColor,
  onSelect,
  onDownload,
}: CityRowProps) {
  const isDownloading = downloadState === 'downloading';
  return (
    <HStack
      spacing={12}
      // Every row has the same padding; only the selected one gets a tinted outline (no layout shift).
      modifiers={[
        padding({ horizontal: 10, vertical: 6 }),
        ...(selected
          ? [
              strokeBorder({
                content: tintColor,
                style: { lineWidth: 2.5 },
                shape: 'roundedRectangle',
                cornerRadius: 20,
              }),
            ]
          : []),
      ]}
    >
      <Button modifiers={[buttonStyle('plain')]} onPress={onSelect}>
        {/* contentShape makes the whole row (incl. the empty area) tappable, not just the text */}
        <HStack spacing={14} modifiers={[contentShape(shapes.rectangle())]}>
          <RNHostView matchContents>
            <CityImage
              source={imageUri ? { uri: imageUri } : undefined}
              style={cityImageStyle}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </RNHostView>
          <VStack alignment="leading" spacing={3}>
            <Text
              modifiers={[
                font({ textStyle: 'headline' }),
                ...(selected ? [foregroundStyle(tintColor)] : []),
              ]}
            >
              {name}
            </Text>
            <Text
              modifiers={[
                font({ textStyle: 'subheadline' }),
                foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
              ]}
            >
              {tagline}
            </Text>
          </VStack>
          <Spacer />
        </HStack>
      </Button>
      {/* Every state gets the same fixed slot, so swapping icons never shifts the row layout. */}
      {isDownloading ? (
        <ProgressView modifiers={[frame({ width: 28, height: 28 })]} />
      ) : downloaded ? (
        <Image
          systemName="checkmark.icloud.fill"
          color="#34C759"
          size={20}
          modifiers={[frame({ width: 28, height: 28 })]}
        />
      ) : (
        <Image
          systemName={
            downloadState === 'error' ? 'exclamationmark.icloud' : 'icloud.and.arrow.down'
          }
          color={downloadState === 'error' ? '#FF3B30' : tintColor}
          size={20}
          modifiers={[frame({ width: 28, height: 28 })]}
          onPress={onDownload}
        />
      )}
    </HStack>
  );
}

export default function SelectCityScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCityId, setSelectedCityIdState] = useState<string | null>(null);
  const [downloadedCityIds, setDownloadedCityIdsState] = useState<string[]>([]);
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [detectedCityId, setDetectedCityId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [selected, downloaded, onboardingDone] = await Promise.all([
        getSelectedCityId(),
        getDownloadedCityIds(),
        getOnboardingDone(),
      ]);
      setSelectedCityIdState(selected);
      setDownloadedCityIdsState(downloaded);
      setIsOnboarding(!onboardingDone);
    };
    load().catch((e) => console.warn('[select-city] load failed', e));
  }, []);

  useEffect(() => {
    if (!isOnboarding) return;
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = (await res.json()) as { latitude?: number; longitude?: number };
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const cityId = findClosestCity(data.latitude, data.longitude);
          if (cityId) setDetectedCityId(cityId);
        }
      } catch {
        // geo detection is best-effort
      }
    };
    detect();
  }, [isOnboarding]);

  // Always alphabetical; the selected city is only highlighted, never moved.
  const cities = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? CITIES.filter((c) => t(`cities.${c.id}`).toLowerCase().includes(q)) : CITIES;
    return [...base].sort((a, b) =>
      t(`cities.${a.id}`).localeCompare(t(`cities.${b.id}`), i18n.language, {
        sensitivity: 'base',
      }),
    );
  }, [search, t, i18n.language]);

  const handleDownload = useCallback(async (cityId: string) => {
    setDownloadStates((prev) => ({ ...prev, [cityId]: 'downloading' }));
    try {
      const payload = await downloadCityData(cityId);
      applyDeletedFromSync(payload.deleted_ids);
      upsertMonumentsFromApi(cityId, payload.monuments);
      upsertMonumentTranslationsFromApi(payload.monument_translations);
      upsertMonumentFieldConfigsFromApi(payload.monument_field_configs);
      upsertRoutesFromSync(cityId, payload.routes);
      upsertRouteStopsFromSync(payload.route_stops);
      upsertRouteTranslationsFromSync(payload.route_translations);
      await prefetchCityImages(cityId);
      await markCityDownloaded(cityId);
      setDownloadedCityIdsState((prev) => (prev.includes(cityId) ? prev : [...prev, cityId]));
      setDownloadStates((prev) => ({ ...prev, [cityId]: 'done' }));
    } catch {
      setDownloadStates((prev) => ({ ...prev, [cityId]: 'error' }));
      setTimeout(() => {
        setDownloadStates((prev) => ({ ...prev, [cityId]: 'idle' }));
      }, 2000);
    }
  }, []);

  // Tapping a row only marks it; the choice is saved when the user confirms with "Continue".
  const handleSelect = useCallback((cityId: string) => {
    setSelectedCityIdState(cityId);
  }, []);

  const handleContinue = async () => {
    if (!selectedCityId) return;
    await Promise.all([setSelectedCityId(selectedCityId), setOnboardingDone(true)]);
    if (isOnboarding) router.replace('/overview');
    else router.back(); // opened as a sheet over the home screen: just dismiss it
  };

  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const showDetected = isOnboarding && detectedCityId && !selectedCityId && search.trim() === '';

  const renderRow = (cityId: string, key: string = cityId) => (
    <CityRow
      key={key}
      name={t(`cities.${cityId}`)}
      tagline={t(`cityTaglines.${cityId}`)}
      imageUri={CITY_IMAGES[cityId]}
      selected={cityId === selectedCityId}
      downloaded={downloadedCityIds.includes(cityId)}
      downloadState={downloadStates[cityId] ?? 'idle'}
      tintColor={colors.primary}
      onSelect={() => handleSelect(cityId)}
      onDownload={() => handleDownload(cityId)}
    />
  );

  return (
    <>
      <Stack.Title>{t('citySelector.whereAreWeGoing')}</Stack.Title>
      <Stack.SearchBar
        placement="stacked"
        placeholder={t('citySelector.searchPlaceholder')}
        autoCapitalize="none"
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch('')}
      />
      {!isOnboarding && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
        </Stack.Toolbar>
      )}

      <View style={styles.container}>
        <Host style={styles.list} useViewportSizeMeasurement modifiers={[scheme]}>
          <Form>
            {/* Static copy of the chosen city, so it stays in view however far the list is scrolled. */}
            {selectedCityId && (
              <Section title={t('citySelector.selectedCity')}>
                {renderRow(selectedCityId, `selected-${selectedCityId}`)}
              </Section>
            )}
            {showDetected && detectedCityId ? (
              <Section title={t('citySelector.detected').replace(/:$/, '')}>
                {renderRow(detectedCityId)}
              </Section>
            ) : (
              <Section
                footer={
                  isOnboarding ? (
                    <Text modifiers={[font({ textStyle: 'footnote' })]}>
                      {t('citySelector.whereDesc')}
                    </Text>
                  ) : undefined
                }
              >
                {cities.map((c) => renderRow(c.id))}
              </Section>
            )}
            {showDetected && (
              <Section>
                {cities.filter((c) => c.id !== detectedCityId).map((c) => renderRow(c.id))}
              </Section>
            )}
            {/* Transparent spacer row: lets the last city scroll clear of the floating button. */}
            <Section>
              <Spacer
                modifiers={[
                  frame({ height: 72 }),
                  listRowBackground('#00000000'),
                  listRowSeparator('hidden'),
                ]}
              />
            </Section>
          </Form>
        </Host>

        {cities.length === 0 && (
          <RNText style={[styles.empty, { color: colors.textMuted }]}>
            {t('citySelector.noResults')}
          </RNText>
        )}

        {/* Floating glass button over the list — no backing bar. */}
        <View
          pointerEvents="box-none"
          style={[styles.floating, { bottom: (initialWindowMetrics?.insets.bottom ?? 0) + 8 }]}
        >
          <Host style={styles.continueHost} modifiers={[scheme]}>
            <Button
              label={t('citySelector.continue')}
              onPress={handleContinue}
              modifiers={[
                buttonStyle('glassProminent'),
                controlSize('large'),
                frame({ maxWidth: 10000 }),
                disabled(!selectedCityId),
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
  list: { flex: 1 },
  empty: { position: 'absolute', alignSelf: 'center', top: 120, fontSize: 17 },
  floating: { position: 'absolute', left: 20, right: 20 },
  continueHost: { height: 52 },
});
