import { CITIES } from '@/src/data/cities';
import { getMonumentCountsByCity } from '@/src/db/monumentRepository';
import {
  getDownloadedCityIds,
  getSelectedCityId,
  setOnboardingDone,
  setSelectedCityId,
  toggleCityDownloaded,
} from '@/src/storage/citySelection';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type CityRowProps = {
  id: string;
  cityName: string;
  objectsCount: number;
  selected: boolean;
  downloaded: boolean;
  onSelect: () => void;
  onToggleDownload: () => void;
  t: (key: string, options?: any) => string;
  colors: any;
};

const CityRow = ({
  cityName,
  objectsCount,
  selected,
  downloaded,
  onSelect,
  onToggleDownload,
  t,
  colors,
}: CityRowProps) => (
  <Pressable
    onPress={onSelect}
    style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: selected ? colors.primary : colors.border,
      },
    ]}
  >
    <View style={styles.cardLeft}>
      <Text style={[styles.cityName, { color: colors.text }]}>{cityName}</Text>
      <Text style={[styles.objectsCount, { color: colors.textMuted }]}>
        {t('citySelector.objectsCount', { count: objectsCount })}
      </Text>
    </View>
    <TouchableOpacity
      onPress={onToggleDownload}
      style={[
        styles.downloadButton,
        { backgroundColor: downloaded ? colors.border : colors.primary },
      ]}
    >
      <Text
        style={[
          styles.downloadButtonText,
          { color: downloaded ? colors.text : colors.oppositeText },
        ]}
      >
        {downloaded ? t('citySelector.downloaded') : t('citySelector.download')}
      </Text>
    </TouchableOpacity>
  </Pressable>
);

export default function SelectCityScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCityId, setSelectedCityIdState] = useState<string | null>(null);
  const [downloadedCityIds, setDownloadedCityIdsState] = useState<string[]>([]);
  const [objectCountsByCity, setObjectCountsByCity] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const [selected, downloaded] = await Promise.all([getSelectedCityId(), getDownloadedCityIds()]);
      setSelectedCityIdState(selected);
      setDownloadedCityIdsState(downloaded);
      setObjectCountsByCity(getMonumentCountsByCity());
    };
    load();
  }, []);

  const cityNameById = (cityId: string) => t(`cities.${cityId}`);

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q ? CITIES : CITIES.filter((city) => cityNameById(city.id).toLowerCase().includes(q));
    return [...base].sort((a, b) =>
      cityNameById(a.id).localeCompare(cityNameById(b.id), i18n.language, { sensitivity: 'base' }),
    );
  }, [search, t, i18n.language]);

  const handleSkip = async () => {
    await setOnboardingDone(true);
    router.replace('/overview');
  };

  const handleContinue = async () => {
    if (!selectedCityId) return;
    await Promise.all([setSelectedCityId(selectedCityId), setOnboardingDone(true)]);
    router.replace('/overview');
  };

  const ctaIsContinue = Boolean(selectedCityId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[headerStyles.headerContent, styles.header]}>
          <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t('citySelector.title')}</Text>
        </View>

        <View style={styles.searchWrap}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder={t('citySelector.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredCities.map((city) => (
            <CityRow
              key={city.id}
              id={city.id}
              cityName={cityNameById(city.id)}
              objectsCount={objectCountsByCity[city.id] ?? 0}
              selected={city.id === selectedCityId}
              downloaded={downloadedCityIds.includes(city.id)}
              onSelect={() => setSelectedCityIdState(city.id)}
              onToggleDownload={async () => {
                const next = await toggleCityDownloaded(city.id);
                setDownloadedCityIdsState(next);
              }}
              t={t}
              colors={colors}
            />
          ))}
          {filteredCities.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('citySelector.noResults')}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={ctaIsContinue ? handleContinue : handleSkip}
          >
            <Text style={styles.ctaText}>
              {ctaIsContinue ? t('citySelector.continue') : t('citySelector.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { justifyContent: 'center', paddingHorizontal: 20 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flex: 1, paddingRight: 10 },
  cityName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  objectsCount: { fontSize: 14, fontWeight: '500' },
  downloadButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  downloadButtonText: { fontSize: 13, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 24 },
  emptyText: { fontSize: 16 },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  ctaButton: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 52 },
  ctaText: { color: 'black', fontSize: 17, fontWeight: '700' },
});
