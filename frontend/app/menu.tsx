import { getAllMonumentPreviews, MonumentPreview, searchMonuments } from '@/src/db/monumentRepository'; // ← было: monumentStore
import { getAllRoutes } from '@/src/db/routeRepository';                                                   // ← было: routeStore
import { headerStyles } from '@/src/theme/headerStyles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
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
import { useTheme } from '../src/theme/ThemeContext';
import { getSelectedCityId } from '@/src/storage/citySelection';

const MenuHeader = ({
  onBack,
  onSettings,
  colors,
  t,
}: {
  onBack(): void;
  onSettings(): void;
  colors: any;
  t: any;
}) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>
        {t('menu.titleFirst')}
        <Text style={{ color: colors.primary }}>{t('menu.titleSecond')}</Text>
      </Text>

      <TouchableOpacity onPress={onSettings} style={headerStyles.iconButton}>
        <Ionicons name="settings-outline" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
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
      placeholder={t('menu.searchPlaceholder')}
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

const CollapsibleSectionTitle = ({
  title,
  expanded,
  onPress,
  colors,
}: {
  title: string;
  expanded: boolean;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={styles.sectionHeaderRow}
  >
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    <Ionicons
      name={expanded ? 'chevron-down' : 'chevron-up'}
      size={22}
      color={colors.primary}
    />
  </TouchableOpacity>
);

const MonumentCard = ({
  item,
  onPress,
  colors,
}: {
  item: MonumentPreview;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    style={[styles.cardContainer, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
    <View style={styles.cardOverlay}>
      <View style={styles.badgeContainer}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>#{item.id}</Text>
      </View>
      {/* item.name уже переведён в репозитории — t() здесь не нужен */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.name}
      </Text>
    </View>
  </TouchableOpacity>
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

const EmptyState = ({ t, colors }: { t: any; colors: any }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="search-outline" size={60} color={colors.textMuted} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('menu.notFound')}</Text>
  </View>
);

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export default function MonumentsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [monumentsExpanded, setMonumentsExpanded] = useState(true);
  const [routesExpanded, setRoutesExpanded] = useState(true);

  const lang = i18n.language;

  // Загружаем все памятники из SQLite с нужным языком
  const allMonuments = useMemo(() => getAllMonumentPreviews(lang, selectedCityId), [lang, selectedCityId]);

  // Фильтрация: searchMonuments делает запрос в SQLite через LIKE
  const filteredMonuments = useMemo(() => {
    const query = searchQuery.trim();
    if (query === '') return allMonuments;
    // Поиск по имени (SQLite LIKE) + по id локально
    const byName = searchMonuments(query, lang, selectedCityId);
    const byId = allMonuments.filter((m) =>
      m.id.toLowerCase().includes(query.toLowerCase()),
    );
    // Объединяем без дублей
    const ids = new Set(byName.map((m) => m.id));
    return [...byName, ...byId.filter((m) => !ids.has(m.id))];
  }, [searchQuery, lang, allMonuments, selectedCityId]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        setSelectedCityId(await getSelectedCityId());
      };
      load();
    }, []),
  );

  const monumentRows = useMemo(() => chunkPairs(filteredMonuments), [filteredMonuments]);

  // Маршруты: имена и описания уже переведены
  const routes = useMemo(() => getAllRoutes(lang, selectedCityId), [lang, selectedCityId]);

  const handleMonumentPress = (monument: MonumentPreview) => {
    router.push(`/info?id=${monument.id}`);
  };

  const handleRoutePress = (routeId: string) => {
    router.push({ pathname: '/route-info', params: { id: routeId } });
  };

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <MenuHeader onBack={handleBack} onSettings={handleSettings} colors={colors} t={t} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} colors={colors} t={t} />
        </View>

        <View style={styles.sectionsWrap}>
          <CollapsibleSectionTitle
            title={t('menu.monuments')}
            expanded={monumentsExpanded}
            onPress={() => setMonumentsExpanded((v) => !v)}
            colors={colors}
          />

          {monumentsExpanded &&
            (filteredMonuments.length === 0 ? (
              <EmptyState t={t} colors={colors} />
            ) : (
              monumentRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.rowWrapper}>
                  {row.map((item) => (
                    <MonumentCard
                      key={item.id}
                      item={item}
                      onPress={() => handleMonumentPress(item)}
                      colors={colors}
                    />
                  ))}
                  {row.length === 1 && <View style={styles.cardPlaceholder} />}
                </View>
              ))
            ))}

          <CollapsibleSectionTitle
            title={t('menu.routes')}
            expanded={routesExpanded}
            onPress={() => setRoutesExpanded((v) => !v)}
            colors={colors}
          />

          {routesExpanded &&
            routes.map((route) => (
              <RouteRow
                key={route.id}
                coverImageUrl={route.coverImageUrl}
                title={route.name}            // ← уже переведено
                onPress={() => handleRoutePress(route.id)}
                colors={colors}
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 40 - CARD_MARGIN * 2) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
  },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sectionsWrap: {
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },
  rowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardPlaceholder: {
    width: CARD_WIDTH,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 12,
  },
  badgeContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
});
