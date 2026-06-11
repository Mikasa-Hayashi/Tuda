import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { clearMonumentCache, getLocalCacheItemCount } from '@/src/db/monumentRepository';
import { notifyMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { clearDownloadedCityIds, getSelectedCityId } from '@/src/storage/citySelection';
import { useTranslation } from 'react-i18next';
import { CITIES } from '@/src/data/cities';

type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'en' | 'ru' | 'ar' | 'zh';

const THEMES: { id: ThemeType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'system', label: 'settings.theme_system', icon: 'phone-portrait-outline' },
  { id: 'light', label: 'settings.theme_light', icon: 'sunny-outline' },
  { id: 'dark', label: 'settings.theme_dark', icon: 'moon-outline' },
];

const LANGUAGES: { id: LanguageType; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'ar', label: 'العربية', flag: '🇸🇦' },
  { id: 'zh', label: '中文', flag: '🇨🇳' },
];

type Colors = ReturnType<typeof useTheme>['colors'];

const SelectionModal = ({
  visible,
  title,
  options,
  selectedId,
  onClose,
  onSelect,
  isLanguage,
  colors,
  t,
}: {
  visible: boolean;
  title: string;
  options: { id: string; label: string; flag?: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }[];
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  isLanguage?: boolean;
  colors: Colors;
  t: (key: string) => string;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity
      style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.separator }]} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.modalOption, { borderBottomColor: colors.separator }]}
            onPress={() => onSelect(opt.id)}
          >
            <View style={styles.modalOptionLeft}>
              {isLanguage ? (
                <Text style={styles.flagIcon}>{opt.flag}</Text>
              ) : (
                <Ionicons
                  name={opt.icon as React.ComponentProps<typeof Ionicons>['name']}
                  size={22}
                  color={colors.icon}
                  style={styles.modalOptionIcon}
                />
              )}
              <Text style={[styles.modalOptionText, { color: colors.text }]}>
                {isLanguage ? opt.label : t(opt.label)}
              </Text>
            </View>
            {selectedId === opt.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as LanguageType;
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [cacheItemCount, setCacheItemCount] = useState(0);
  const [selectedCityName, setSelectedCityName] = useState('');

  const refreshData = useCallback(() => {
    setCacheItemCount(getLocalCacheItemCount());
    getSelectedCityId().then((cityId) => {
      const city = CITIES.find((c) => c.id === cityId);
      setSelectedCityName(city ? t(`cities.${city.id}`) : '—');
    });
  }, [t]);

  useFocusEffect(useCallback(() => { refreshData(); }, [refreshData]));

  const currentThemeLabel = t(THEMES.find((th) => th.id === themeMode)?.label ?? '');
  const currentLangLabel = LANGUAGES.find((l) => l.id === currentLanguage)?.label ?? '';

  const handleClearCache = () => {
    Alert.alert(t('settings.clearCacheTitle'), t('settings.clearCacheMessage'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.clear'),
        style: 'destructive',
        onPress: async () => {
          clearMonumentCache();
          await clearDownloadedCityIds();
          notifyMonumentCacheCleared();
          refreshData();
        },
      },
    ]);
  };

  const Row = ({
    label,
    value,
    onPress,
    destructive,
    isLast,
  }: {
    label: string;
    value?: string;
    onPress: () => void;
    destructive?: boolean;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        { borderBottomColor: colors.separator },
        isLast && styles.rowLast,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.rowLabel, { color: destructive ? colors.danger : colors.text }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>
        ) : null}
        {!destructive && (
          <Text style={[styles.rowChevron, { color: colors.textMuted }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>{t('settings.title')}</Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
          {t('settings.preferences')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            label={`🌐 ${t('settings.language')}`}
            value={currentLangLabel}
            onPress={() => setLangModalVisible(true)}
          />
          <Row
            label={`📍 ${t('citySelector.title')}`}
            value={selectedCityName}
            onPress={() => router.push('/select-city')}
          />
          <Row
            label={`🌗 ${t('settings.theme')}`}
            value={currentThemeLabel}
            onPress={() => setThemeModalVisible(true)}
            isLast
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
          {t('settings.storage')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            label={`🗑 ${t('settings.clearCache')}`}
            value={t('settings.cacheItems', { count: cacheItemCount })}
            onPress={handleClearCache}
            destructive
            isLast
          />
        </View>
      </ScrollView>

      <SelectionModal
        visible={themeModalVisible}
        title={t('settings.chooseTheme')}
        options={THEMES.map((th) => ({ id: th.id, label: th.label, icon: th.icon }))}
        selectedId={themeMode}
        onClose={() => setThemeModalVisible(false)}
        onSelect={(id) => { setThemeMode(id as ThemeType); setThemeModalVisible(false); }}
        colors={colors}
        t={t}
      />
      <SelectionModal
        visible={langModalVisible}
        title={t('settings.chooseLanguage')}
        options={LANGUAGES}
        selectedId={currentLanguage}
        onClose={() => setLangModalVisible(false)}
        onSelect={(id) => { i18n.changeLanguage(id); setLangModalVisible(false); }}
        isLanguage
        colors={colors}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 22,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 16 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15 },
  rowChevron: { fontSize: 20, fontWeight: '300' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 38,
    height: 5,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  modalOptionIcon: { marginRight: 14 },
  flagIcon: { fontSize: 22, marginRight: 14 },
  modalOptionText: { fontSize: 17 },
});
