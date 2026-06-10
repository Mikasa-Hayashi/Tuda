import { CITIES, findClosestCity } from '@/src/data/cities';
import {
  getMonumentCountsByCity,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import {
  upsertRoutesFromSync,
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
} from '@/src/db/routeRepository';
import { fetchMonumentCountsByCity, downloadCityData } from '@/src/services/monumentsApi';
import {
  getDownloadedCityIds,
  getOnboardingDone,
  getSelectedCityId,
  markCityDownloaded,
  setOnboardingDone,
  setSelectedCityId,
} from '@/src/storage/citySelection';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { SearchBar } from '@/src/components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Colors = ReturnType<typeof useTheme>['colors'];

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

type CityRowProps = {
  cityName: string;
  objectsCount: number;
  selected: boolean;
  downloaded: boolean;
  downloadState: DownloadState;
  onSelect: () => void;
  onDownload: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  colors: Colors;
};

const CityRow = ({
  cityName,
  objectsCount,
  selected,
  downloaded,
  downloadState,
  onSelect,
  onDownload,
  t,
  colors,
}: CityRowProps) => {
  const isDownloading = downloadState === 'downloading';

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.cardLeft}>
        {selected && (
          <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
        )}
        <View style={styles.cardText}>
          <Text style={[styles.cityName, { color: colors.text }]}>{cityName}</Text>
          <Text style={[styles.objectsCount, { color: colors.textMuted }]}>
            {t('citySelector.objectsCount', { count: objectsCount })}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onDownload}
        disabled={isDownloading || downloaded}
        style={[
          styles.downloadButton,
          {
            backgroundColor: downloaded
              ? colors.primaryDim
              : isDownloading
              ? colors.cardElevated
              : colors.primary,
          },
        ]}
        activeOpacity={0.75}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : downloaded ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        ) : (
          <Ionicons name="cloud-download-outline" size={20} color={colors.oppositeText} />
        )}
      </TouchableOpacity>
    </Pressable>
  );
};

const GeoDetectBanner = ({ cityName, onAccept, onDismiss, colors }: {
  cityName: string;
  onAccept: () => void;
  onDismiss: () => void;
  colors: Colors;
}) => (
  <View style={[styles.geoBanner, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
    <Ionicons name="location" size={18} color={colors.primary} />
    <Text style={[styles.geoBannerText, { color: colors.text }]}>
      Detected: <Text style={{ fontWeight: '700', color: colors.primary }}>{cityName}</Text>
    </Text>
    <View style={styles.geoBannerActions}>
      <TouchableOpacity onPress={onAccept} style={[styles.geoBannerBtn, { backgroundColor: colors.primary }]}>
        <Text style={[styles.geoBannerBtnText, { color: colors.oppositeText }]}>Select</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} style={styles.geoBannerDismiss}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function SelectCityScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCityId, setSelectedCityIdState] = useState<string | null>(null);
  const [downloadedCityIds, setDownloadedCityIdsState] = useState<string[]>([]);
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});
  const [objectCountsByCity, setObjectCountsByCity] = useState<Record<string, number>>({});
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [detectedCityId, setDetectedCityId] = useState<string | null>(null);
  const [geoDismissed, setGeoDismissed] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;

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

      const localCounts = getMonumentCountsByCity();
      try {
        const apiCounts = await fetchMonumentCountsByCity();
        const cityIds = new Set([...Object.keys(localCounts), ...Object.keys(apiCounts)]);
        setObjectCountsByCity(
          Object.fromEntries(
            [...cityIds].map((cityId) => [cityId, Math.max(localCounts[cityId] ?? 0, apiCounts[cityId] ?? 0)]),
          ),
        );
      } catch {
        setObjectCountsByCity(localCounts);
      }
    };
    load();
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
        // no-op: geo detection is best-effort
      }
    };
    detect();
  }, [isOnboarding]);

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? CITIES
      : CITIES.filter((city) => t(`cities.${city.id}`).toLowerCase().includes(q));
    return [...base].sort((a, b) =>
      t(`cities.${a.id}`).localeCompare(t(`cities.${b.id}`), i18n.language, { sensitivity: 'base' }),
    );
  }, [search, t, i18n.language]);

  const handleDownload = useCallback(async (cityId: string) => {
    setDownloadStates((prev) => ({ ...prev, [cityId]: 'downloading' }));
    try {
      const payload = await downloadCityData(cityId);
      upsertMonumentsFromApi(cityId, payload.monuments);
      upsertMonumentTranslationsFromApi(payload.monument_translations);
      upsertMonumentFieldConfigsFromApi(payload.monument_field_configs);
      upsertRoutesFromSync(cityId, payload.routes);
      upsertRouteStopsFromSync(payload.route_stops);
      upsertRouteTranslationsFromSync(payload.route_translations);
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

  const handleContinue = async () => {
    if (!selectedCityId) return;
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    await Promise.all([setSelectedCityId(selectedCityId), setOnboardingDone(true)]);
    router.replace('/overview');
  };

  const handleBack = () => router.back();

  const showGeoBanner = detectedCityId && !geoDismissed && !selectedCityId;
  const detectedCityName = detectedCityId ? t(`cities.${detectedCityId}`) : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[headerStyles.headerContent, styles.header]}>
          {!isOnboarding ? (
            <TouchableOpacity onPress={handleBack} style={headerStyles.iconButton}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={headerStyles.iconButton} />
          )}
          <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t('citySelector.title')}</Text>
          <View style={headerStyles.iconButton} />
        </View>

        {showGeoBanner && (
          <View style={styles.geoBannerWrap}>
            <GeoDetectBanner
              cityName={detectedCityName}
              onAccept={() => {
                setSelectedCityIdState(detectedCityId);
                setGeoDismissed(true);
              }}
              onDismiss={() => setGeoDismissed(true)}
              colors={colors}
            />
          </View>
        )}

        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('citySelector.searchPlaceholder')}
          />
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredCities.map((city) => (
            <CityRow
              key={city.id}
              cityName={t(`cities.${city.id}`)}
              objectsCount={objectCountsByCity[city.id] ?? 0}
              selected={city.id === selectedCityId}
              downloaded={downloadedCityIds.includes(city.id)}
              downloadState={downloadStates[city.id] ?? 'idle'}
              onSelect={() => setSelectedCityIdState(city.id)}
              onDownload={() => handleDownload(city.id)}
              t={t}
              colors={colors}
            />
          ))}
          {filteredCities.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('citySelector.noResults')}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {isOnboarding && !selectedCityId && (
            <Text style={[styles.selectHint, { color: colors.textMuted }]}>
              {t('citySelector.selectHint', { defaultValue: 'Select a city to continue' })}
            </Text>
          )}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.ctaButton,
                {
                  backgroundColor: selectedCityId ? colors.primary : colors.cardElevated,
                  opacity: selectedCityId ? 1 : 0.6,
                },
              ]}
              onPress={handleContinue}
              disabled={!selectedCityId}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaText, { color: selectedCityId ? colors.oppositeText : colors.textMuted }]}>
                {t('citySelector.continue')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { justifyContent: 'space-between', paddingHorizontal: 8 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  selectedDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  cardText: { flex: 1 },
  cityName: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  objectsCount: { fontSize: 13, fontWeight: '500' },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geoBannerWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  geoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  geoBannerText: { flex: 1, fontSize: 14 },
  geoBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  geoBannerBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  geoBannerBtnText: { fontSize: 13, fontWeight: '700' },
  geoBannerDismiss: { padding: 4 },
  emptyWrap: { alignItems: 'center', paddingTop: 24 },
  emptyText: { fontSize: 16 },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  selectHint: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  ctaButton: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 54 },
  ctaText: { fontSize: 17, fontWeight: '700' },
});
