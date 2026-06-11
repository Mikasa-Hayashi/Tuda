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
import { useTheme } from '@/src/theme/ThemeContext';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';
type Colors = ReturnType<typeof useTheme>['colors'];

const HeroCityCard = ({
  cityId,
  cityName,
  objectsCount,
  selected,
  downloaded,
  downloadState,
  onSelect,
  onDownload,
  colors,
  t,
}: {
  cityId: string;
  cityName: string;
  objectsCount: number;
  selected: boolean;
  downloaded: boolean;
  downloadState: DownloadState;
  onSelect: () => void;
  onDownload: () => void;
  colors: Colors;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) => {
  const isDownloading = downloadState === 'downloading';
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.heroCard, selected && styles.heroCardSelected]}
      android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
    >
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>
          {objectsCount > 0 ? t('citySelector.objectsCount', { count: objectsCount }) : '—'}
        </Text>
      </View>
      <View style={styles.heroBottom}>
        <Text style={styles.heroCityName}>{cityName}</Text>
        {selected && (
          <TouchableOpacity
            onPress={onDownload}
            disabled={isDownloading || downloaded}
            style={styles.heroDownloadBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : downloaded ? (
              <Ionicons name="checkmark-circle" size={22} color="rgba(255,255,255,0.9)" />
            ) : (
              <Ionicons name="cloud-download-outline" size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
};

const CityRow = ({
  cityName,
  objectsCount,
  selected,
  downloaded,
  downloadState,
  onSelect,
  onDownload,
  colors,
  t,
}: {
  cityName: string;
  objectsCount: number;
  selected: boolean;
  downloaded: boolean;
  downloadState: DownloadState;
  onSelect: () => void;
  onDownload: () => void;
  colors: Colors;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) => {
  const isDownloading = downloadState === 'downloading';
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.cityRow,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.cityRowLeft}>
        <Text style={[styles.cityRowName, { color: colors.text }]}>{cityName}</Text>
        <Text style={[styles.cityRowCount, { color: colors.textMuted }]}>
          {objectsCount > 0 ? t('citySelector.objectsCount', { count: objectsCount }) : '—'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDownload}
        disabled={isDownloading || downloaded}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.cityRowDownload}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : downloaded ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        ) : (
          <Text style={[styles.cityRowDownloadText, { color: colors.primaryDeep }]}>↓</Text>
        )}
      </TouchableOpacity>
    </Pressable>
  );
};

export default function SelectCityScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
            [...cityIds].map((id) => [id, Math.max(localCounts[id] ?? 0, apiCounts[id] ?? 0)]),
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
        // geo detection is best-effort
      }
    };
    detect();
  }, [isOnboarding]);

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? CITIES
      : CITIES.filter((c) => t(`cities.${c.id}`).toLowerCase().includes(q));
    return [...base].sort((a, b) =>
      t(`cities.${a.id}`).localeCompare(t(`cities.${b.id}`), i18n.language, {
        sensitivity: 'base',
      }),
    );
  }, [search, t, i18n.language]);

  const heroCity = useMemo(() => {
    if (search.trim() || filteredCities.length === 0) return null;
    const withCounts = filteredCities.map((c) => ({
      city: c,
      count: objectCountsByCity[c.id] ?? 0,
    }));
    withCounts.sort((a, b) => b.count - a.count || a.city.id.localeCompare(b.city.id));
    return withCounts[0].city;
  }, [filteredCities, objectCountsByCity, search]);

  const listCities = useMemo(
    () => (heroCity ? filteredCities.filter((c) => c.id !== heroCity.id) : filteredCities),
    [filteredCities, heroCity],
  );

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

  const showGeoBanner = detectedCityId && !geoDismissed && !selectedCityId;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('citySelector.whereAreWeGoing')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('citySelector.whereDesc')}
        </Text>

        {showGeoBanner && (
          <View
            style={[
              styles.geoBanner,
              { backgroundColor: colors.primaryDim, borderColor: colors.primary },
            ]}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[styles.geoBannerText, { color: colors.text }]}>
              {t('citySelector.detected')}{' '}
              <Text style={{ fontWeight: '700', color: colors.primary }}>
                {t(`cities.${detectedCityId}`)}
              </Text>
            </Text>
            <View style={styles.geoBannerActions}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCityIdState(detectedCityId);
                  setGeoDismissed(true);
                }}
                style={[styles.geoBannerBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.geoBannerBtnText, { color: '#FFFFFF' }]}>{t('citySelector.select')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGeoDismissed(true)} style={styles.geoBannerDismiss}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('citySelector.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {heroCity && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
              {t('citySelector.popular')}
            </Text>
            <HeroCityCard
              cityId={heroCity.id}
              cityName={t(`cities.${heroCity.id}`)}
              objectsCount={objectCountsByCity[heroCity.id] ?? 0}
              selected={heroCity.id === selectedCityId}
              downloaded={downloadedCityIds.includes(heroCity.id)}
              downloadState={downloadStates[heroCity.id] ?? 'idle'}
              onSelect={() => setSelectedCityIdState(heroCity.id)}
              onDownload={() => handleDownload(heroCity.id)}
              colors={colors}
              t={t}
            />
          </>
        )}

        {listCities.length > 0 && (
          <View style={styles.listSection}>
            {listCities.map((city) => (
              <CityRow
                key={city.id}
                cityName={t(`cities.${city.id}`)}
                objectsCount={objectCountsByCity[city.id] ?? 0}
                selected={city.id === selectedCityId}
                downloaded={downloadedCityIds.includes(city.id)}
                downloadState={downloadStates[city.id] ?? 'idle'}
                onSelect={() => setSelectedCityIdState(city.id)}
                onDownload={() => handleDownload(city.id)}
                colors={colors}
                t={t}
              />
            ))}
          </View>
        )}

        {filteredCities.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('citySelector.noResults')}
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.separator,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        {!selectedCityId && (
          <Text style={[styles.selectHint, { color: colors.textMuted }]}>
            {t('citySelector.selectHint')}
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
            <Text
              style={[
                styles.ctaText,
                { color: selectedCityId ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              {t('citySelector.continue')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  geoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  geoBannerText: { flex: 1, fontSize: 14 },
  geoBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  geoBannerBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  geoBannerBtnText: { fontSize: 13, fontWeight: '700' },
  geoBannerDismiss: { padding: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
  },
  searchInput: { flex: 1, fontSize: 15, height: 22 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 18,
    height: 128,
    backgroundColor: '#C8782A',
    padding: 14,
    justifyContent: 'space-between',
    marginBottom: 18,
    shadowColor: '#8E4A12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  heroCardSelected: {
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroCityName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  heroDownloadBtn: { padding: 4 },
  listSection: { gap: 11 },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  cityRowLeft: { flex: 1 },
  cityRowName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cityRowCount: { fontSize: 12 },
  cityRowDownload: { padding: 4 },
  cityRowDownloadText: { fontSize: 20, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingTop: 32 },
  emptyText: { fontSize: 16 },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 8,
  },
  selectHint: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
  ctaButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  ctaText: { fontSize: 17, fontWeight: '700' },
});
