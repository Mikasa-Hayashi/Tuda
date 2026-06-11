import {
  getAllMonumentPreviews,
  getMonumentCountByCity,
  getSyncMeta,
  MonumentPreview,
  searchMonuments,
  setSyncMeta,
  upsertMonumentFieldConfigsFromApi,
  upsertMonumentsFromApi,
  upsertMonumentTranslationsFromApi,
} from '@/src/db/monumentRepository';
import {
  upsertRoutesFromSync,
  upsertRouteStopsFromSync,
  upsertRouteTranslationsFromSync,
} from '@/src/db/routeRepository';
import { MONUMENT_TAG_IDS } from '@/src/data/monumentFilterMeta';
import { onMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import {
  fetchMonumentDetail,
  fetchMonumentsPage,
  searchMonumentsRemote,
  syncCityData,
} from '@/src/services/monumentsApi';
import { SkeletonRow } from '@/src/components/SkeletonCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { useTheme } from '@/src/theme/ThemeContext';
import { CITIES } from '@/src/data/cities';
import { getSelectedCityId, markCityDownloaded } from '@/src/storage/citySelection';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';

type SortMode = 'default' | 'name' | 'popularity';
type Colors = ReturnType<typeof useTheme>['colors'];

const SORT_OPTIONS: { mode: SortMode; label: string; emoji: string }[] = [
  { mode: 'popularity', label: 'overview.sortPopularity', emoji: '⭐' },
  { mode: 'default', label: 'overview.sortRecommended', emoji: '📋' },
  { mode: 'name', label: 'overview.sortName', emoji: '🔤' },
];

const SortSheet = ({
  visible,
  sortMode,
  onSelect,
  onClose,
  colors,
  t,
}: {
  visible: boolean;
  sortMode: SortMode;
  onSelect: (m: SortMode) => void;
  onClose: () => void;
  colors: Colors;
  t: (k: string) => string;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.sheetOverlay} onPress={onClose}>
      <Pressable
        style={[styles.sheetPanel, { backgroundColor: colors.background }]}
        onPress={() => {}}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.separator }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          {t('overview.sortTitle')}
        </Text>
        {SORT_OPTIONS.map((opt) => {
          const active = sortMode === opt.mode;
          return (
            <TouchableOpacity
              key={opt.mode}
              onPress={() => { onSelect(opt.mode); onClose(); }}
              style={[
                styles.sheetOption,
                {
                  backgroundColor: colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: active ? 2 : 1,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.sheetOptionText, { color: colors.text }]}>
                {opt.emoji} {t(opt.label)}
              </Text>
              {active && (
                <View
                  style={[styles.sheetOptionDot, { backgroundColor: colors.primary }]}
                />
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.sheetApplyBtn, { backgroundColor: colors.primary }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.sheetApplyText}>{t('overview.filterApply')}</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);

const FilterSheet = ({
  visible,
  selectedTags,
  onToggleTag,
  onClear,
  onClose,
  colors,
  t,
}: {
  visible: boolean;
  selectedTags: string[];
  onToggleTag: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  colors: Colors;
  t: (k: string) => string;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.sheetOverlay} onPress={onClose}>
      <Pressable
        style={[styles.sheetPanel, { backgroundColor: colors.background }]}
        onPress={() => {}}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.separator }]} />
        <View style={styles.sheetRow}>
          <Text style={[styles.sheetTitle, { color: colors.text, marginBottom: 0 }]}>
            {t('overview.filterTitle')}
          </Text>
          {selectedTags.length > 0 && (
            <TouchableOpacity onPress={onClear}>
              <Text style={[styles.sheetReset, { color: colors.primaryDeep }]}>
                {t('overview.filterReset')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.sheetSectionLabel, { color: colors.primaryDeep }]}>
          {t('overview.filterCategory')}
        </Text>
        <View style={styles.tagChipsWrap}>
          <TouchableOpacity
            onPress={onClear}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedTags.length === 0 ? colors.text : colors.card,
                borderColor: selectedTags.length === 0 ? colors.text : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: selectedTags.length === 0 ? colors.background : colors.textSecondary },
              ]}
            >
              {t('overview.allObjects')}
            </Text>
          </TouchableOpacity>
          {MONUMENT_TAG_IDS.map((tagId) => {
            const selected = selectedTags.includes(tagId);
            return (
              <TouchableOpacity
                key={tagId}
                onPress={() => onToggleTag(tagId)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selected ? colors.text : colors.card,
                    borderColor: selected ? colors.text : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: selected ? colors.background : colors.textSecondary },
                  ]}
                >
                  {t(`overview.tags.${tagId}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.sheetApplyBtn, { backgroundColor: colors.primary }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.sheetApplyText}>
            {t('overview.filterApply')}
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);

const MonumentCard = ({
  item,
  onPress,
  colors,
}: {
  item: MonumentPreview;
  onPress: () => void;
  colors: Colors;
}) => (
  <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.88}>
    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
    <View style={styles.cardGradient}>
      <View style={styles.cardHeart}>
        <Text style={styles.cardHeartIcon}>♡</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.name}
      </Text>
    </View>
  </TouchableOpacity>
);

const EmptyState = ({ t, colors }: { t: (k: string) => string; colors: Colors }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="search-outline" size={52} color={colors.textMuted} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('menu.notFound')}</Text>
  </View>
);

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

export default function OverviewTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [allMonuments, setAllMonuments] = useState<MonumentPreview[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [searchResults, setSearchResults] = useState<MonumentPreview[] | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const lang = i18n.language;

  const textFiltered = useMemo(() => {
    const query = searchQuery.trim();
    if (query === '') return allMonuments;
    return searchResults ?? searchMonuments(query, lang, selectedCityId);
  }, [searchQuery, lang, allMonuments, selectedCityId, searchResults]);

  const tagFiltered = useMemo(() => {
    if (selectedTags.length === 0) return textFiltered;
    return textFiltered.filter((m) => m.tags.some((tag) => selectedTags.includes(tag)));
  }, [textFiltered, selectedTags]);

  const filteredMonuments = useMemo(() => {
    const list = [...tagFiltered];
    if (sortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, lang, { sensitivity: 'base' }));
    } else if (sortMode === 'popularity') {
      list.sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, lang, { sensitivity: 'base' }));
    } else {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    }
    return list;
  }, [tagFiltered, sortMode, lang]);

  const monumentRows = useMemo(() => chunkPairs(filteredMonuments), [filteredMonuments]);

  const refreshLocalMonuments = useCallback((cityId: string | null, language: string) => {
    setAllMonuments(getAllMonumentPreviews(language, cityId));
  }, []);

  useEffect(() => {
    return onMonumentCacheCleared(() => {
      setAllMonuments([]);
      setSearchResults(null);
      setNextOffset(0);
      setHasMore(true);
      getSelectedCityId().then((cityId) => refreshLocalMonuments(cityId, lang));
    });
  }, [lang, refreshLocalMonuments]);

  const storeMonumentDetails = useCallback(async (monumentIds: string[]) => {
    const details = await Promise.all(monumentIds.map((id) => fetchMonumentDetail(id)));
    const translations = details.flatMap((d) =>
      d.translations.map((tr) => ({ ...tr, monument_id: d.id })),
    );
    upsertMonumentTranslationsFromApi(translations);
  }, []);

  const runSync = useCallback(async (cityId: string, sinceIso: string) => {
    const payload = await syncCityData(cityId, sinceIso);
    upsertMonumentsFromApi(cityId, payload.monuments);
    upsertMonumentTranslationsFromApi(payload.monument_translations);
    upsertMonumentFieldConfigsFromApi(payload.monument_field_configs);
    upsertRoutesFromSync(cityId, payload.routes);
    upsertRouteStopsFromSync(payload.route_stops);
    upsertRouteTranslationsFromSync(payload.route_translations);
    setSyncMeta(cityId, 'last_sync', new Date().toISOString());
  }, []);

  const loadNextPage = useCallback(
    async (cityId: string, force = false) => {
      if (!force && (isLoadingMore || !hasMore)) return;
      setIsLoadingMore(true);
      try {
        const pageSize = 20;
        const page = await fetchMonumentsPage(cityId, pageSize, nextOffset);
        upsertMonumentsFromApi(cityId, page);
        await storeMonumentDetails(page.map((m) => m.id));
        const updatedOffset = nextOffset + page.length;
        setNextOffset(updatedOffset);
        setSyncMeta(cityId, 'next_offset', String(updatedOffset));
        setHasMore(page.length === pageSize);
        refreshLocalMonuments(cityId, lang);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [hasMore, isLoadingMore, lang, nextOffset, refreshLocalMonuments, storeMonumentDetails],
  );

  useFocusEffect(
    useCallback(() => {
      const loadCityAndSync = async () => {
        const cityId = await getSelectedCityId();
        setSelectedCityId(cityId);
        const city = CITIES.find((c) => c.id === cityId) ?? null;
        setSelectedCityName(city ? t(`cities.${city.id}`) : null);
        refreshLocalMonuments(cityId, lang);
        if (!cityId) return;

        setIsBootstrapping(true);
        setIsOffline(false);
        try {
          const syncSince = getSyncMeta(cityId, 'last_sync') ?? '1970-01-01T00:00:00.000Z';
          await runSync(cityId, syncSince);

          const localCount = getMonumentCountByCity(cityId);
          const storedOffset = Number(getSyncMeta(cityId, 'next_offset') ?? String(localCount));
          setNextOffset(Number.isFinite(storedOffset) ? storedOffset : localCount);

          if (localCount === 0) {
            setHasMore(true);
            await loadNextPage(cityId, true);
            await markCityDownloaded(cityId);
          } else {
            refreshLocalMonuments(cityId, lang);
          }
        } catch {
          setIsOffline(getMonumentCountByCity(cityId) === 0);
          refreshLocalMonuments(cityId, lang);
        } finally {
          setIsBootstrapping(false);
        }
      };
      loadCityAndSync();
    }, [lang, loadNextPage, refreshLocalMonuments, runSync, t]),
  );

  useEffect(() => {
    refreshLocalMonuments(selectedCityId, lang);
  }, [lang, refreshLocalMonuments, selectedCityId]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!selectedCityId || query === '') {
      setSearchResults(null);
      setIsOffline(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const remote = await searchMonumentsRemote(selectedCityId, query, lang, 30);
        setSearchResults(
          remote.map((item) => ({
            id: item.id,
            lat: item.lat,
            lon: item.lon,
            imageUrl: item.image_url,
            name: item.name,
            popularity: 0,
            sortOrder: 0,
            tags: [],
          })),
        );
        setIsOffline(false);
      } catch {
        setSearchResults(searchMonuments(query, lang, selectedCityId));
        setIsOffline(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [lang, searchQuery, selectedCityId]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!selectedCityId || searchQuery.trim() !== '') return;
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceToBottom < 240) void loadNextPage(selectedCityId);
    },
    [loadNextPage, searchQuery, selectedCityId],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={200}
      >
        <View style={styles.cityHeader}>
          <Text style={[styles.cityLabel, { color: colors.textMuted }]}>
            {t('overview.locationLabel')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/select-city')}
            activeOpacity={0.75}
          >
            <Text style={[styles.cityName, { color: colors.text }]}>
              {selectedCityName ?? t('citySelector.notSelected')} ▾
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('menu.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.catalogHeader}>
          <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
            {t('overview.allObjects')}
          </Text>
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => setSortSheetOpen(true)}
              style={[
                styles.toolBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons name="swap-vertical-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>
                {t('overview.sortButton')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterSheetOpen(true)}
              style={[
                styles.toolBtn,
                {
                  backgroundColor: selectedTags.length > 0 ? colors.text : colors.card,
                  borderColor: selectedTags.length > 0 ? colors.text : colors.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons
                name="options-outline"
                size={14}
                color={selectedTags.length > 0 ? colors.background : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toolBtnText,
                  {
                    color:
                      selectedTags.length > 0 ? colors.background : colors.textSecondary,
                  },
                ]}
              >
                {t('overview.filterButton')}
                {selectedTags.length > 0 ? ` · ${selectedTags.length}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isOffline && (
          <View
            style={[
              styles.offlineBanner,
              { backgroundColor: colors.cardElevated, borderColor: colors.border },
            ]}
          >
            <Ionicons name="cloud-offline-outline" size={15} color={colors.textMuted} />
            <Text style={[styles.offlineBannerText, { color: colors.textMuted }]}>
              Офлайн — показываем сохранённые данные
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          {isBootstrapping ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filteredMonuments.length === 0 ? (
            <EmptyState t={t} colors={colors} />
          ) : (
            monumentRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.rowWrapper}>
                {row.map((item) => (
                  <MonumentCard
                    key={item.id}
                    item={item}
                    onPress={() => router.push(`/info?id=${item.id}`)}
                    colors={colors}
                  />
                ))}
                {row.length === 1 && <View style={styles.cardPlaceholder} />}
              </View>
            ))
          )}
          {isLoadingMore && !isBootstrapping && <SkeletonRow />}
        </View>
      </ScrollView>

      <SortSheet
        visible={sortSheetOpen}
        sortMode={sortMode}
        onSelect={setSortMode}
        onClose={() => setSortSheetOpen(false)}
        colors={colors}
        t={t}
      />
      <FilterSheet
        visible={filterSheetOpen}
        selectedTags={selectedTags}
        onToggleTag={(id) =>
          setSelectedTags((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
        onClear={() => setSelectedTags([])}
        onClose={() => setFilterSheetOpen(false)}
        colors={colors}
        t={t}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 40 - CARD_MARGIN * 2) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  cityHeader: { paddingHorizontal: 18, paddingBottom: 14 },
  cityLabel: { fontSize: 12 },
  cityName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 18,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 15, height: 22 },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  toolbar: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  toolBtnText: { fontSize: 13, fontWeight: '600' },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 18,
    marginBottom: 12,
  },
  offlineBannerText: { fontSize: 13, fontWeight: '500' },
  grid: { paddingHorizontal: 20 },
  rowWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardPlaceholder: { width: CARD_WIDTH },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E7E0D4',
  },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    backgroundImage: undefined,
    justifyContent: 'space-between',
    padding: 11,
  },
  cardHeart: {
    alignSelf: 'flex-end',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeartIcon: { color: '#FFFFFF', fontSize: 15 },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    position: 'absolute',
    bottom: 11,
    left: 11,
    right: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,14,6,0.4)',
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 38,
    height: 5,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  sheetReset: { fontSize: 14, fontWeight: '600' },
  sheetSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 13,
    padding: 14,
    marginBottom: 10,
  },
  sheetOptionText: { fontSize: 16, fontWeight: '600' },
  sheetOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 22 },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 13, fontWeight: '600' },
  sheetApplyBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sheetApplyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
