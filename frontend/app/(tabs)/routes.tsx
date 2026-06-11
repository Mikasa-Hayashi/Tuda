import { onMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { getAllRoutes, RoutePreview } from '@/src/db/routeRepository';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Colors = ReturnType<typeof useTheme>['colors'];
type SortMode = 'default' | 'name';

const FILTER_PILLS = [
  { id: 'all', labelKey: 'routesScreen.filterAll' },
  { id: 'kids', labelKey: 'routesScreen.filterKids' },
  { id: 'military', labelKey: 'routesScreen.filterMilitary' },
  { id: 'walking', labelKey: 'routesScreen.filterWalking' },
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
      <Pressable style={[styles.sheetPanel, { backgroundColor: colors.background }]} onPress={() => {}}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.separator }]} />
        <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('routesScreen.sortTitle')}</Text>
        {([
          { mode: 'default' as const, label: '⭐ По популярности' },
          { mode: 'name' as const, label: '🔤 По алфавиту' },
        ] as const).map((opt) => (
          <TouchableOpacity
            key={opt.mode}
            onPress={() => { onSelect(opt.mode); onClose(); }}
            style={[
              styles.sheetOption,
              {
                backgroundColor: colors.card,
                borderColor: sortMode === opt.mode ? colors.primary : colors.border,
                borderWidth: sortMode === opt.mode ? 2 : 1,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
            {sortMode === opt.mode && (
              <View style={[styles.sheetDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.sheetApply, { backgroundColor: colors.primary }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.sheetApplyText}>Применить</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);

const RouteCard = ({
  route,
  onPress,
  colors,
}: {
  route: RoutePreview;
  onPress: () => void;
  colors: Colors;
}) => (
  <TouchableOpacity
    style={[styles.routeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.88}
  >
    <View style={styles.routeCardImage}>
      {route.coverImageUrl ? (
        <Image source={{ uri: route.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#9a6a3a' }]} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
      <View style={styles.routeCardHeart}>
        <Text style={styles.routeCardHeartIcon}>♡</Text>
      </View>
      {route.stopCount > 0 && (
        <View style={styles.routeCardBadge}>
          <Text style={styles.routeCardBadgeText}>📍 {route.stopCount} точки</Text>
        </View>
      )}
    </View>
    <View style={styles.routeCardBody}>
      <Text style={[styles.routeCardTitle, { color: colors.text }]} numberOfLines={1}>
        {route.name}
      </Text>
      {route.description ? (
        <Text style={[styles.routeCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {route.description}
        </Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

export default function RoutesTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
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

  const sortedRoutes = useMemo(() => {
    const list = [...routes];
    if (sortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, i18n.language, { sensitivity: 'base' }));
    }
    return list;
  }, [routes, sortMode, i18n.language]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>{t('tabs.routes')}</Text>
          <TouchableOpacity
            onPress={() => setSortSheetOpen(true)}
            style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Ionicons name="swap-vertical-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>
              {t('overview.sortButton')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/ai-route')}
          style={styles.aiCard}
          activeOpacity={0.88}
        >
          <View>
            <Text style={styles.aiCardKicker}>{t('routesScreen.aiPromo')}</Text>
            <Text style={styles.aiCardTitle}>{t('routesScreen.aiPromoTitle')}</Text>
            <Text style={styles.aiCardDesc}>{t('routesScreen.aiPromoDesc')}</Text>
          </View>
          <Text style={styles.aiCardEmoji}>✨</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {FILTER_PILLS.map((pill) => (
            <TouchableOpacity
              key={pill.id}
              onPress={() => setActiveFilter(pill.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeFilter === pill.id ? colors.text : colors.card,
                  borderColor: activeFilter === pill.id ? colors.text : colors.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color: activeFilter === pill.id ? colors.background : colors.textSecondary,
                  },
                ]}
              >
                {t(pill.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {sortedRoutes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('menu.notFound')}</Text>
          </View>
        ) : (
          <View style={styles.routesList}>
            {sortedRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onPress={() => router.push({ pathname: '/route-info', params: { id: route.id } })}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <SortSheet
        visible={sortSheetOpen}
        sortMode={sortMode}
        onSelect={setSortMode}
        onClose={() => setSortSheetOpen(false)}
        colors={colors}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
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
  aiCard: {
    marginHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#C8782A',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    shadowColor: '#8E4A12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  aiCardKicker: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  aiCardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  aiCardDesc: { color: 'rgba(255,255,255,0.88)', fontSize: 13, marginTop: 2 },
  aiCardEmoji: { fontSize: 28 },
  filterPillsRow: {
    paddingHorizontal: 18,
    gap: 8,
    paddingBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 30,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 13, fontWeight: '600' },
  routesList: { paddingHorizontal: 18, gap: 14 },
  routeCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  routeCardImage: {
    height: 120,
    backgroundColor: '#9a6a3a',
    position: 'relative',
  },
  routeCardHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCardHeartIcon: { color: '#FFFFFF', fontSize: 15 },
  routeCardBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  routeCardBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  routeCardBody: { padding: 13 },
  routeCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  routeCardDesc: { fontSize: 13, lineHeight: 18 },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, fontWeight: '600' },
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
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 13,
    padding: 14,
    marginBottom: 10,
  },
  sheetOptionText: { fontSize: 16, fontWeight: '600' },
  sheetDot: { width: 10, height: 10, borderRadius: 5 },
  sheetApply: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  sheetApplyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
