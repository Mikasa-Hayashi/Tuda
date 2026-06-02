import { getAllMonumentPreviews, MonumentPreview, searchMonuments } from '@/src/db/monumentRepository';
import { MONUMENT_TAG_IDS } from '@/src/data/monumentFilterMeta';
import { headerStyles } from '@/src/theme/headerStyles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
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
import { useTheme } from '@/src/theme/ThemeContext';
import { CITIES } from '@/src/data/cities';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';

type SortMode = 'default' | 'name' | 'popularity';

const OverviewHeader = ({ onSettings, colors, t }: { onSettings(): void; colors: any; t: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <View style={headerStyles.iconButton} />

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
      placeholder="Search"
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
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.name}
      </Text>
    </View>
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
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

export default function OverviewTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const lang = i18n.language;

  const allMonuments = useMemo(() => getAllMonumentPreviews(lang, selectedCityId), [lang, selectedCityId]);

  const textFiltered = useMemo(() => {
    const query = searchQuery.trim();
    if (query === '') return allMonuments;
    return searchMonuments(query, lang, selectedCityId);
  }, [searchQuery, lang, allMonuments, selectedCityId]);

  const tagFiltered = useMemo(() => {
    if (selectedTags.length === 0) return textFiltered;
    return textFiltered.filter((m) => m.tags.some((tag) => selectedTags.includes(tag)));
  }, [textFiltered, selectedTags]);

  const filteredMonuments = useMemo(() => {
    const list = [...tagFiltered];
    if (sortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, lang, { sensitivity: 'base' }));
    } else if (sortMode === 'popularity') {
      list.sort(
        (a, b) =>
          b.popularity - a.popularity || a.name.localeCompare(b.name, lang, { sensitivity: 'base' }),
      );
    } else {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    }
    return list;
  }, [tagFiltered, sortMode, lang]);

  const monumentRows = useMemo(() => chunkPairs(filteredMonuments), [filteredMonuments]);

  const visibleTagIds = useMemo(() => {
    const q = tagSearchQuery.trim().toLowerCase();
    return MONUMENT_TAG_IDS.filter((id) => {
      if (!q) return true;
      const label = t(`overview.tags.${id}`).toLowerCase();
      return label.includes(q);
    });
  }, [tagSearchQuery, t]);

  const displayedTagIds = useMemo(
    () => (tagsExpanded ? visibleTagIds : visibleTagIds.slice(0, 4)),
    [visibleTagIds, tagsExpanded],
  );

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadCity = async () => {
        const cityId = await getSelectedCityId();
        setSelectedCityId(cityId);
        const city = CITIES.find((c) => c.id === cityId) ?? null;
        setSelectedCityName(city ? t(`cities.${city.id}`) : null);
      };
      loadCity();
    }, [t]),
  );

  const sortOptions: { mode: SortMode; labelKey: string }[] = [
    { mode: 'default', labelKey: 'overview.sortRecommended' },
    { mode: 'name', labelKey: 'overview.sortName' },
    { mode: 'popularity', labelKey: 'overview.sortPopularity' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <OverviewHeader onSettings={() => router.push('/settings')} colors={colors} t={t} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <TouchableOpacity
            style={[styles.citySelectorButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/select-city')}
            activeOpacity={0.8}
          >
            <View style={styles.citySelectorTextWrap}>
              <Text style={[styles.citySelectorLabel, { color: colors.textMuted }]}>{t('citySelector.currentCity')}</Text>
              <Text style={[styles.citySelectorValue, { color: colors.text }]}>
                {selectedCityName ?? t('citySelector.notSelected')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.searchRow}>
            <View style={styles.searchRowInputWrap}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} colors={colors} t={t} />
            </View>
            <TouchableOpacity
              onPress={() => setFilterPanelOpen((o) => !o)}
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: selectedTags.length ? colors.primary : colors.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('overview.filters')}
            >
              <Ionicons name="funnel-outline" size={22} color={colors.text} />
              {selectedTags.length > 0 ? (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.oppositeText }]}>{selectedTags.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.sortRow}>
            {sortOptions.map(({ mode, labelKey }) => {
              const active = sortMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setSortMode(mode)}
                  style={[
                    styles.sortChip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.card : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[styles.sortChipText, { color: active ? colors.primary : colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {t(labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filterPanelOpen ? (
            <View style={[styles.filterPanel, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.tagSearchContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} style={styles.tagSearchIcon} />
                <TextInput
                  style={[styles.tagSearchInput, { color: colors.text }]}
                  placeholder={t('overview.tagSearchPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={tagSearchQuery}
                  onChangeText={setTagSearchQuery}
                  returnKeyType="done"
                />
                {tagSearchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setTagSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.tagChipsWrap}>
                {displayedTagIds.map((tagId) => {
                  const selected = selectedTags.includes(tagId);
                  return (
                    <TouchableOpacity
                      key={tagId}
                      onPress={() => toggleTag(tagId)}
                      style={[
                        styles.tagChip,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.tagChipText, { color: selected ? colors.oppositeText : colors.text }]}
                        numberOfLines={1}
                      >
                        {t(`overview.tags.${tagId}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {visibleTagIds.length > 4 ? (
                <TouchableOpacity onPress={() => setTagsExpanded((e) => !e)} style={styles.showMoreBtn}>
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    {t(tagsExpanded ? 'overview.showLess' : 'overview.showMore')}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {selectedTags.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSelectedTags([])}
                  style={styles.clearFiltersBtn}
                >
                  <Text style={[styles.clearFiltersText, { color: colors.textMuted }]}>{t('overview.clearFilters')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.sectionsWrap}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('menu.monuments')}</Text>
          {filteredMonuments.length === 0 ? (
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
  scrollContent: { paddingBottom: 40 },
  topSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  citySelectorButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  citySelectorTextWrap: { flex: 1 },
  citySelectorLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  citySelectorValue: { fontSize: 16, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchRowInputWrap: { flex: 1, minWidth: 0 },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 11, fontWeight: '800' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 13, fontWeight: '600' },
  filterPanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  tagSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 12,
  },
  tagSearchIcon: { marginRight: 8 },
  tagSearchInput: { flex: 1, fontSize: 15, height: '100%' },
  tagChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  tagChipText: { fontSize: 13, fontWeight: '600' },
  showMoreBtn: { marginTop: 10, alignSelf: 'flex-start' },
  showMoreText: { fontSize: 14, fontWeight: '700' },
  clearFiltersBtn: { marginTop: 8, alignSelf: 'flex-start' },
  clearFiltersText: { fontSize: 14, fontWeight: '600' },
  sectionsWrap: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 8,
  },
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
  rowWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardPlaceholder: { width: CARD_WIDTH },
  cardContainer: { width: CARD_WIDTH, height: CARD_WIDTH * 1.3, borderRadius: 16, overflow: 'hidden' },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15 },
});
