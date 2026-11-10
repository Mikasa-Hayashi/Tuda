import { SymbolIcon } from '@/src/components/ListGroup';
import { onMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { seedTestMonumentsIfEmpty, seedTestRoutesIfEmpty } from '@/src/db/devSeed';
import { getAllRoutes, RoutePreview } from '@/src/db/routeRepository';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { useFavorites } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeContext';
import { Image } from 'expo-image';
import { Link, Stack, useFocusEffect, useScrollToTop } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type SortMode = 'default' | 'name';

const SORT_OPTIONS: { mode: SortMode; label: string; icon: string }[] = [
  { mode: 'default', label: 'overview.sortRecommended', icon: 'list.bullet' },
  { mode: 'name', label: 'overview.sortName', icon: 'textformat.abc' },
];

export default function RoutesTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const favorites = useFavorites();
  const listRef = useRef<FlatList<RoutePreview>>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [query, setQuery] = useState('');
  const [cacheVersion, setCacheVersion] = useState(0);
  useScrollToTop(listRef);

  // Re-read when the cache is cleared in Settings.
  useEffect(() => onMonumentCacheCleared(() => setCacheVersion((v) => v + 1)), []);

  const routes = useMemo(() => {
    void cacheVersion;
    if (__DEV__ && selectedCityId) {
      // Fake data only when the backend gave us nothing (see src/db/devSeed.ts).
      seedTestMonumentsIfEmpty(selectedCityId);
      seedTestRoutesIfEmpty(selectedCityId);
    }
    return getAllRoutes(i18n.language, selectedCityId);
  }, [cacheVersion, i18n.language, selectedCityId]);

  useFocusEffect(
    useCallback(() => {
      getSelectedCityId().then(setSelectedCityId);
    }, []),
  );

  const visibleRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? routes.filter(
          (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
        )
      : [...routes];
    if (sortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, i18n.language, { sensitivity: 'base' }));
    }
    return list;
  }, [routes, query, sortMode, i18n.language]);

  const renderItem = useCallback(
    ({ item }: { item: RoutePreview }) => (
      <Link href={{ pathname: '/route-info', params: { id: item.id } }}>
        <Link.Trigger>
          <View style={styles.card}>
            <Image
              source={item.coverImageUrl ? { uri: item.coverImageUrl } : undefined}
              style={[styles.cover, { backgroundColor: colors.cardElevated }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.id}
            />
            <View style={styles.titleRow}>
              <Text style={[styles.title, styles.titleText, { color: colors.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              {favorites.isFavorite('route', item.id) && (
                <SymbolIcon sf="heart.fill" fallback="heart" size={16} color="#FF3B30" />
              )}
            </View>
            {item.description ? (
              <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.stopCount > 0 && (
              <View style={styles.meta}>
                <SymbolIcon
                  sf="mappin.and.ellipse"
                  fallback="location-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {t('routesScreen.stopsCount', { count: item.stopCount })}
                </Text>
              </View>
            )}
          </View>
        </Link.Trigger>
        <Link.Menu>
          <Link.MenuAction
            icon={favorites.isFavorite('route', item.id) ? 'heart.slash' : 'heart'}
            onPress={() => void favorites.toggle('route', item.id)}
          >
            {favorites.isFavorite('route', item.id) ? t('favorites.remove') : t('favorites.add')}
          </Link.MenuAction>
        </Link.Menu>
      </Link>
    ),
    [colors.cardElevated, colors.text, colors.textMuted, colors.textSecondary, favorites, t],
  );

  return (
    <>
      <Stack.Title large>{t('tabs.routes')}</Stack.Title>
      <Stack.SearchBar
        placement="integratedButton"
        placeholder={t('routesScreen.searchPlaceholder')}
        autoCapitalize="none"
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis.circle">
          <Stack.Toolbar.Menu inline title={t('routesScreen.sortTitle')}>
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
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <FlatList
        ref={listRef}
        data={visibleRoutes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <SymbolIcon
              sf="point.topleft.down.to.point.bottomright.curvepath"
              fallback="trail-sign-outline"
              size={52}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('menu.notFound')}</Text>
          </View>
        }
      />

    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 24 },
  card: { gap: 4 },
  pressed: { opacity: 0.7 },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { flex: 1 },
  desc: { fontSize: 15, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaText: { fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
});
