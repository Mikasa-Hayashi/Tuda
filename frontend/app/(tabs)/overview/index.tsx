import { SymbolIcon } from '@/src/components/ListGroup';
import { MONUMENT_TAG_IDS } from '@/src/data/monumentFilterMeta';
import { CITIES } from '@/src/data/cities';
import { onMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { seedTestMonumentsIfEmpty } from '@/src/db/devSeed';
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
import {
  fetchMonumentsPage,
  searchMonumentsRemote,
  syncCityData,
} from '@/src/services/monumentsApi';
import { getSelectedCityId, markCityDownloaded } from '@/src/storage/citySelection';
import { useFavorites } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeContext';
import { Image } from 'expo-image';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

type SortMode = 'default' | 'name' | 'popularity';

const SORT_OPTIONS: { mode: SortMode; label: string; icon: string }[] = [
  { mode: 'popularity', label: 'overview.sortPopularity', icon: 'star' },
  { mode: 'default', label: 'overview.sortRecommended', icon: 'list.bullet' },
  { mode: 'name', label: 'overview.sortName', icon: 'textformat.abc' },
];

const SIDE_INSET = 16;
const COLUMN_GAP = 12;
/** Don't hit the network again when the tab is re-focused within this window. */
const FOCUS_SYNC_COOLDOWN_MS = 60_000;

function sameMonuments(a: MonumentPreview[], b: MonumentPreview[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.name !== y.name ||
      x.imageUrl !== y.imageUrl ||
      x.popularity !== y.popularity ||
      x.sortOrder !== y.sortOrder ||
      x.tags.join(',') !== y.tags.join(',')
    ) {
      return false;
    }
  }
  return true;
}

export default function OverviewTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<MonumentPreview>>(null);
  const loadNextPageRef = useRef<(cityId: string, force?: boolean) => Promise<void>>(
    async () => {},
  );
  const isSyncRunningRef = useRef(false);
  const lastFocusSyncRef = useRef<{ cityId: string; at: number } | null>(null);
  // Re-tapping the tab scrolls to the top natively (react-native-screens accounts for the large
  // title inset). A JS useScrollToTop would reset to offset 0 and stop short of the very top.

  const favorites = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allMonuments, setAllMonuments] = useState<MonumentPreview[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [searchResults, setSearchResults] = useState<MonumentPreview[] | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lang = i18n.language;
  const cardWidth = (width - SIDE_INSET * 2 - COLUMN_GAP) / 2;

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
    const byName = (a: MonumentPreview, b: MonumentPreview) =>
      a.name.localeCompare(b.name, lang, { sensitivity: 'base' });
    if (sortMode === 'name') {
      list.sort(byName);
    } else if (sortMode === 'popularity') {
      list.sort((a, b) => b.popularity - a.popularity || byName(a, b));
    } else {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    }
    return list;
  }, [tagFiltered, sortMode, lang]);

  // Keep the previous array when nothing changed: switching back to this tab re-reads the DB,
  // and a new (identical) array would re-render every card and make the grid flicker.
  const refreshLocalMonuments = useCallback((cityId: string | null, language: string) => {
    const next = getAllMonumentPreviews(language, cityId);
    setAllMonuments((prev) => (sameMonuments(prev, next) ? prev : next));
  }, []);

  /** DEV only: if the backend gave us nothing, fill the cache with fake monuments. */
  const ensureDevData = useCallback(
    (cityId: string) => {
      try {
        if (__DEV__ && seedTestMonumentsIfEmpty(cityId)) {
          refreshLocalMonuments(cityId, lang);
        }
      } catch (e) {
        console.warn('[devSeed] failed', e);
      }
    },
    [lang, refreshLocalMonuments],
  );

  useEffect(() => {
    return onMonumentCacheCleared(() => {
      setAllMonuments([]);
      setSearchResults(null);
      setNextOffset(0);
      setHasMore(true);
      getSelectedCityId()
        .then((cityId) => refreshLocalMonuments(cityId, lang))
        .catch((e) => console.warn('[overview] refresh after cache clear failed', e));
    });
  }, [lang, refreshLocalMonuments]);

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
        const pageTranslations = page.flatMap((m) => m.translations ?? []);
        if (pageTranslations.length > 0) {
          upsertMonumentTranslationsFromApi(pageTranslations);
        }
        const updatedOffset = nextOffset + page.length;
        setNextOffset(updatedOffset);
        setSyncMeta(cityId, 'next_offset', String(updatedOffset));
        setHasMore(page.length === pageSize);
        refreshLocalMonuments(cityId, lang);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [hasMore, isLoadingMore, lang, nextOffset, refreshLocalMonuments],
  );
  loadNextPageRef.current = loadNextPage;

  const handleRefresh = useCallback(async () => {
    if (!selectedCityId || isSyncRunningRef.current) return;
    isSyncRunningRef.current = true;
    setIsRefreshing(true);
    try {
      const syncSince = getSyncMeta(selectedCityId, 'last_sync') ?? '1970-01-01T00:00:00.000Z';
      await runSync(selectedCityId, syncSince);
      setIsOffline(false);
      refreshLocalMonuments(selectedCityId, lang);
    } catch {
      setIsOffline(true);
      refreshLocalMonuments(selectedCityId, lang);
      ensureDevData(selectedCityId);
    } finally {
      setIsRefreshing(false);
      isSyncRunningRef.current = false;
    }
  }, [ensureDevData, lang, refreshLocalMonuments, runSync, selectedCityId]);

  useFocusEffect(
    useCallback(() => {
      const loadCityAndSync = async () => {
        if (isSyncRunningRef.current) return;
        isSyncRunningRef.current = true;

        const cityId = await getSelectedCityId();
        setSelectedCityId(cityId);
        const city = CITIES.find((c) => c.id === cityId) ?? null;
        setSelectedCityName(city ? t(`cities.${city.id}`) : null);
        refreshLocalMonuments(cityId, lang);
        if (!cityId) {
          isSyncRunningRef.current = false;
          return;
        }

        const preCount = getMonumentCountByCity(cityId);
        // Tab re-focus with data already on screen: skip the network round-trip entirely.
        const recentlySynced =
          lastFocusSyncRef.current?.cityId === cityId &&
          Date.now() - lastFocusSyncRef.current.at < FOCUS_SYNC_COOLDOWN_MS;
        if (preCount > 0 && recentlySynced) {
          isSyncRunningRef.current = false;
          return;
        }
        lastFocusSyncRef.current = { cityId, at: Date.now() };
        setIsBootstrapping(preCount === 0);
        try {
          const syncSince = getSyncMeta(cityId, 'last_sync') ?? '1970-01-01T00:00:00.000Z';
          await runSync(cityId, syncSince);
          setIsOffline(false);

          const localCount = getMonumentCountByCity(cityId);
          const storedOffset = Number(getSyncMeta(cityId, 'next_offset') ?? String(localCount));
          setNextOffset(Number.isFinite(storedOffset) ? storedOffset : localCount);

          if (localCount === 0) {
            setHasMore(true);
            await loadNextPageRef.current(cityId, true);
            await markCityDownloaded(cityId);
          } else {
            refreshLocalMonuments(cityId, lang);
          }
        } catch {
          setIsOffline(true);
          refreshLocalMonuments(cityId, lang);
        } finally {
          ensureDevData(cityId);
          setIsBootstrapping(false);
          isSyncRunningRef.current = false;
        }
      };
      loadCityAndSync().catch((e) => {
        console.warn('[overview] loadCityAndSync failed', e);
        isSyncRunningRef.current = false;
        setIsBootstrapping(false);
      });
    }, [ensureDevData, lang, refreshLocalMonuments, runSync, t]),
  );

  useEffect(() => {
    refreshLocalMonuments(selectedCityId, lang);
  }, [lang, refreshLocalMonuments, selectedCityId]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!selectedCityId || query === '') {
      setSearchResults(null);
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
      } catch {
        setSearchResults(searchMonuments(query, lang, selectedCityId));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [lang, searchQuery, selectedCityId]);

  const onEndReached = useCallback(() => {
    if (!selectedCityId || searchQuery.trim() !== '' || isOffline) return;
    void loadNextPage(selectedCityId).catch(() => {});
  }, [isOffline, loadNextPage, searchQuery, selectedCityId]);

  const toggleTag = useCallback((id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MonumentPreview }) => (
      <Link href={{ pathname: '/info', params: { id: item.id } }}>
        <Link.Trigger>
          <View style={{ width: cardWidth }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.cardImage, { width: cardWidth, backgroundColor: colors.cardElevated }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.id}
            />
            {favorites.isFavorite('monument', item.id) && (
              <View style={styles.favBadge}>
                <SymbolIcon sf="heart.fill" fallback="heart" size={16} color="#FF3B30" />
              </View>
            )}
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        </Link.Trigger>
        <Link.Menu>
          <Link.MenuAction
            icon={favorites.isFavorite('monument', item.id) ? 'heart.slash' : 'heart'}
            onPress={() => void favorites.toggle('monument', item.id)}
          >
            {favorites.isFavorite('monument', item.id)
              ? t('favorites.remove')
              : t('favorites.add')}
          </Link.MenuAction>
        </Link.Menu>
      </Link>
    ),
    [cardWidth, colors.cardElevated, colors.text, favorites, t],
  );

  const listHeader = isOffline ? (
    <View style={[styles.offlineBanner, { backgroundColor: colors.cardElevated }]}>
      <SymbolIcon sf="icloud.slash" fallback="cloud-offline-outline" size={16} color={colors.textMuted} />
      <Text style={[styles.offlineText, { color: colors.textSecondary }]}>
        {t('overview.offline')}
      </Text>
    </View>
  ) : undefined;

  const listEmpty = isBootstrapping ? (
    <ActivityIndicator style={styles.centered} size="large" />
  ) : (
    <View style={styles.centered}>
      <SymbolIcon sf="magnifyingglass" fallback="search-outline" size={52} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('menu.notFound')}</Text>
    </View>
  );

  const filtersActive = selectedTags.length > 0;

  return (
    <>
      <Stack.Title large>{selectedCityName ?? t('citySelector.notSelected')}</Stack.Title>
      <Stack.SearchBar
        placement="integratedButton"
        placeholder={t('menu.searchPlaceholder')}
        autoCapitalize="none"
        onChangeText={(e) => setSearchQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearchQuery('')}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="mappin.and.ellipse"
          accessibilityLabel={t('overview.changeCity')}
          onPress={() => router.push('/select-city')}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon={filtersActive ? 'ellipsis.circle.fill' : 'ellipsis.circle'}>
          <Stack.Toolbar.Menu inline title={t('overview.sortTitle')}>
            {SORT_OPTIONS.map((opt) => (
              <Stack.Toolbar.MenuAction
                key={opt.mode}
                icon={opt.icon as never}
                isOn={sortMode === opt.mode}
                onPress={() => setSortMode(opt.mode)}
              >
                {t(opt.label)}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
          <Stack.Toolbar.Menu title={t('overview.filterTitle')} icon="line.3.horizontal.decrease">
            {MONUMENT_TAG_IDS.map((tagId) => (
              <Stack.Toolbar.MenuAction
                key={tagId}
                isOn={selectedTags.includes(tagId)}
                onPress={() => toggleTag(tagId)}
              >
                {t(`overview.tags.${tagId}`)}
              </Stack.Toolbar.MenuAction>
            ))}
            {filtersActive && (
              <Stack.Toolbar.MenuAction
                icon="xmark.circle"
                destructive
                onPress={() => setSelectedTags([])}
              >
                {t('overview.filterReset')}
              </Stack.Toolbar.MenuAction>
            )}
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <FlatList
        ref={listRef}
        data={isBootstrapping ? [] : filteredMonuments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          isLoadingMore && !isBootstrapping ? (
            <ActivityIndicator style={styles.footer} />
          ) : undefined
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SIDE_INSET, paddingBottom: 24 },
  column: { gap: COLUMN_GAP, marginBottom: 16 },
  favBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  pressed: { opacity: 0.7 },
  cardImage: { aspectRatio: 4 / 5, borderRadius: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  offlineText: { fontSize: 13, flexShrink: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  footer: { paddingVertical: 16 },
});
