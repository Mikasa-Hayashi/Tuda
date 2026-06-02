import { getAllRoutes } from '@/src/db/routeRepository';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RoutesHeader = ({ onSettings, colors, t }: { onSettings(): void; colors: any; t: any }) => (
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

const RouteRow = ({
  coverImageUrl,
  title,
  onPress,
  colors,
}: {
  coverImageUrl: string;
  title: string;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    style={[styles.routeRow, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Image source={{ uri: coverImageUrl }} style={styles.routeRowImage} />
    <View style={styles.routeRowTextWrap}>
      <Text style={[styles.routeRowTitle, { color: colors.text }]} numberOfLines={2}>
        {title}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
  </TouchableOpacity>
);

const SearchBar = ({
  value,
  onChange,
  colors,
  t,
}: {
  value: string;
  onChange: (text: string) => void;
  colors: any;
  t: any;
}) => (
  <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
    <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
    <TextInput
      style={[styles.searchInput, { color: colors.text }]}
      placeholder={t('routesScreen.searchPlaceholder')}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChange}
      returnKeyType="done"
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChange('')} style={styles.clearButton}>
        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);

export default function RoutesTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  useScrollToTop(scrollRef);

  const routes = useMemo(
    () => getAllRoutes(i18n.language, selectedCityId),
    [i18n.language, selectedCityId],
  );
  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return routes;
    return routes.filter((route) => route.name.toLowerCase().includes(query));
  }, [routes, searchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => setSelectedCityId(await getSelectedCityId());
      load();
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RoutesHeader onSettings={() => router.push('/settings')} colors={colors} t={t} />

      <View style={styles.searchWrap}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} colors={colors} t={t} />
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
                colors={colors}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  clearButton: { padding: 5 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 88,
  },
  routeRowImage: {
    width: 100,
    height: 88,
  },
  routeRowTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  routeRowTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyWrap: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  customRouteButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  customRouteButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  customRouteButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
