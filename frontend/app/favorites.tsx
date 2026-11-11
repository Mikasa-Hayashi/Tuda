import { SymbolIcon } from '@/src/components/ListGroup';
import { getAllMonumentPreviews, type MonumentPreview } from '@/src/db/monumentRepository';
import { getAllRoutes, type RoutePreview } from '@/src/db/routeRepository';
import { useFavorites } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeContext';
import { ContentUnavailableView, Host } from '@expo/ui/swift-ui';
import { preferredColorScheme } from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const SIDE_INSET = 16;
const COLUMN_GAP = 12;

type Catalog = { monuments: Map<string, MonumentPreview>; routes: Map<string, RoutePreview> };

/** Favorites as photo cards: monuments in a 2-column grid (like Overview), routes as wide cards. */
export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const favorites = useFavorites();
  const { monumentIds, routeIds } = favorites;
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const cardWidth = (width - SIDE_INSET * 2 - COLUMN_GAP) / 2;

  // Read the local DB once, after the push transition (synchronous reads would stall the
  // animation). Un-favoriting afterwards only filters this catalog, so it is instant.
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setCatalog({
        monuments: new Map(getAllMonumentPreviews(i18n.language).map((m) => [m.id, m])),
        routes: new Map(getAllRoutes(i18n.language).map((r) => [r.id, r])),
      });
    }, 380);
    return () => clearTimeout(timer);
  }, [i18n.language]);

  const monuments = useMemo(
    () => monumentIds.flatMap((id) => catalog?.monuments.get(id) ?? []),
    [monumentIds, catalog],
  );
  const routes = useMemo(
    () => routeIds.flatMap((id) => catalog?.routes.get(id) ?? []),
    [routeIds, catalog],
  );

  const isEmpty = catalog !== null && monuments.length === 0 && routes.length === 0;

  if (isEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} modifiers={[scheme]}>
          <ContentUnavailableView
            title={t('favorites.empty')}
            systemImage="heart"
            description={t('favorites.hint')}
          />
        </Host>
      </View>
    );
  }

  const removeLabel = t('favorites.remove');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {monuments.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('favorites.monuments')}
            </Text>
            <View style={styles.grid}>
              {monuments.map((m) => (
                <Link key={m.id} href={{ pathname: '/info', params: { id: m.id } }}>
                  <Link.Trigger>
                    <View style={{ width: cardWidth }}>
                      <Image
                        source={{ uri: m.imageUrl }}
                        style={[
                          styles.monumentImage,
                          { width: cardWidth, backgroundColor: colors.cardElevated },
                        ]}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={m.id}
                      />
                      <View style={styles.heart}>
                        <SymbolIcon sf="heart.fill" fallback="heart" size={16} color="#FF3B30" />
                      </View>
                      <Text
                        style={[styles.monumentTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {m.name}
                      </Text>
                    </View>
                  </Link.Trigger>
                  <Link.Menu>
                    <Link.MenuAction
                      icon="heart.slash"
                      onPress={() => void favorites.toggle('monument', m.id)}
                    >
                      {removeLabel}
                    </Link.MenuAction>
                  </Link.Menu>
                </Link>
              ))}
            </View>
          </View>
        )}

        {routes.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('favorites.routes')}
            </Text>
            <View style={styles.routeList}>
              {routes.map((r) => (
                <Link key={r.id} href={{ pathname: '/route-info', params: { id: r.id } }}>
                  <Link.Trigger>
                    <View>
                      <Image
                        source={r.coverImageUrl ? { uri: r.coverImageUrl } : undefined}
                        style={[styles.routeCover, { backgroundColor: colors.cardElevated }]}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={r.id}
                      />
                      <View style={styles.heart}>
                        <SymbolIcon sf="heart.fill" fallback="heart" size={16} color="#FF3B30" />
                      </View>
                      <Text style={[styles.routeTitle, { color: colors.text }]} numberOfLines={2}>
                        {r.name}
                      </Text>
                      {r.stopCount > 0 && (
                        <Text style={[styles.routeMeta, { color: colors.textMuted }]}>
                          {t('routesScreen.stopsCount', { count: r.stopCount })}
                        </Text>
                      )}
                    </View>
                  </Link.Trigger>
                  <Link.Menu>
                    <Link.MenuAction
                      icon="heart.slash"
                      onPress={() => void favorites.toggle('route', r.id)}
                    >
                      {removeLabel}
                    </Link.MenuAction>
                  </Link.Menu>
                </Link>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SIDE_INSET, paddingTop: 8, paddingBottom: 32, gap: 28 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: COLUMN_GAP, rowGap: 16 },
  monumentImage: { aspectRatio: 4 / 5, borderRadius: 14 },
  monumentTitle: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  routeList: { gap: 20 },
  routeCover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16 },
  routeTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  routeMeta: { fontSize: 13, marginTop: 2 },
  heart: {
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
});
