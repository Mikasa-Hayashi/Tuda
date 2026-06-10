import { onMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { getAllRoutes, RoutePreview } from '@/src/db/routeRepository';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { SearchBar } from '@/src/components/SearchBar';
import { RouteRow } from '@/src/components/RouteRow';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Colors = ReturnType<typeof useTheme>['colors'];

const RoutesHeader = ({ onSettings, colors, t }: { onSettings(): void; colors: Colors; t: (key: string) => string }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <View style={headerStyles.iconButton} />
      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t('menu.routes')}</Text>
      <TouchableOpacity onPress={onSettings} style={headerStyles.iconButton}>
        <Ionicons name="settings-outline" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

export default function RoutesTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState<RoutePreview[]>([]);
  useScrollToTop(scrollRef);

  const refreshRoutes = useCallback(() => {
    setRoutes(getAllRoutes(i18n.language, selectedCityId));
  }, [i18n.language, selectedCityId]);

  useEffect(refreshRoutes, [refreshRoutes]);
  useEffect(() => onMonumentCacheCleared(refreshRoutes), [refreshRoutes]);

  useFocusEffect(
    useCallback(() => {
      getSelectedCityId().then(setSelectedCityId);
    }, []),
  );

  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return routes;
    return routes.filter((route) => route.name.toLowerCase().includes(query));
  }, [routes, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RoutesHeader onSettings={() => router.push('/settings')} colors={colors} t={t} />
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('routesScreen.searchPlaceholder')}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.listWrap}>
          {filteredRoutes.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('menu.notFound')}</Text>
            </View>
          ) : (
            filteredRoutes.map((route) => (
              <RouteRow
                key={route.id}
                coverImageUrl={route.coverImageUrl}
                title={route.name}
                onPress={() => router.push({ pathname: '/route-info', params: { id: route.id } })}
              />
            ))
          )}
        </View>
      </ScrollView>
      <View style={styles.customRouteButtonContainer}>
        <TouchableOpacity
          style={[styles.customRouteButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.9}
          onPress={() => {}}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.oppositeText} />
          <Text style={[styles.customRouteButtonText, { color: colors.oppositeText }]}>
            {t('routesScreen.customRoute')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  listWrap: { paddingHorizontal: 20, paddingTop: 12 },
  emptyWrap: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  customRouteButtonContainer: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  customRouteButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  customRouteButtonText: { fontSize: 16, fontWeight: '800' },
});
