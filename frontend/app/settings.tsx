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
import { headerStyles } from '@/src/theme/headerStyles';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { clearMonumentCache, getLocalCacheItemCount } from '@/src/db/monumentRepository';
import { notifyMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { clearDownloadedCityIds } from '@/src/storage/citySelection';
import { useTranslation } from 'react-i18next';

type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'en' | 'ru' | 'ar' | 'zh';

const THEMES: { id: ThemeType; labelKey: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'system', labelKey: 'settings.theme_system', icon: 'phone-portrait-outline' },
  { id: 'light', labelKey: 'settings.theme_light', icon: 'sunny-outline' },
  { id: 'dark', labelKey: 'settings.theme_dark', icon: 'moon-outline' },
];

const LANGUAGES: { id: LanguageType; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'ar', label: 'العربية', flag: '🇸🇦' },
  { id: 'zh', label: '中文', flag: '🇨🇳' },
];

type Colors = ReturnType<typeof useTheme>['colors'];

const SettingsHeader = ({ onBack, colors, t }: { onBack(): void; colors: Colors; t: (key: string) => string }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>
      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
      <View style={headerStyles.iconButton} />
    </View>
  </SafeAreaView>
);

const SettingsSection = ({ title, children, colors }: { title: string; children: React.ReactNode; colors: Colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>{children}</View>
  </View>
);

const SettingsRow = ({
  icon,
  title,
  value,
  onPress,
  isLast,
  color,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  color?: string;
  colors: Colors;
}) => (
  <TouchableOpacity
    style={[styles.row, { borderBottomColor: colors.border }, isLast && styles.rowNoBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={22} color={color ?? colors.icon} style={styles.rowIcon} />
      <Text style={[styles.rowTitle, { color: color ?? colors.text }]}>{title}</Text>
    </View>
    <View style={styles.rowRight}>
      {value && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  </TouchableOpacity>
);

type ThemeOption = (typeof THEMES)[number];
type LangOption = (typeof LANGUAGES)[number];

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
  options: ThemeOption[] | LangOption[];
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  isLanguage?: boolean;
  colors: Colors;
  t: (key: string) => string;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.modalOption, { borderBottomColor: colors.border }]}
            onPress={() => onSelect(opt.id)}
          >
            <View style={styles.modalOptionLeft}>
              {isLanguage ? (
                <Text style={styles.flagIcon}>{(opt as LangOption).flag}</Text>
              ) : (
                <Ionicons
                  name={(opt as ThemeOption).icon}
                  size={22}
                  color={colors.icon}
                  style={styles.modalOptionIcon}
                />
              )}
              <Text style={[styles.modalOptionText, { color: colors.text }]}>
                {isLanguage ? (opt as LangOption).label : t((opt as ThemeOption).labelKey)}
              </Text>
            </View>
            {selectedId === opt.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
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

  const refreshCacheSize = useCallback(() => {
    setCacheItemCount(getLocalCacheItemCount());
  }, []);

  useFocusEffect(useCallback(() => { refreshCacheSize(); }, [refreshCacheSize]));

  const currentThemeLabel = t(THEMES.find((th) => th.id === themeMode)?.labelKey ?? '');
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
          refreshCacheSize();
          Alert.alert(t('settings.clearCacheTitle'), t('settings.cacheCleared'));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SettingsHeader onBack={() => router.back()} colors={colors} t={t} />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <SettingsSection title={t('settings.preferences')} colors={colors}>
          <SettingsRow
            icon="color-palette-outline"
            title={t('settings.theme')}
            value={currentThemeLabel}
            onPress={() => setThemeModalVisible(true)}
            colors={colors}
          />
          <SettingsRow
            icon="language-outline"
            title={t('settings.language')}
            value={currentLangLabel}
            onPress={() => setLangModalVisible(true)}
            isLast
            colors={colors}
          />
        </SettingsSection>
        <SettingsSection title={t('settings.storage')} colors={colors}>
          <SettingsRow
            icon="trash-bin-outline"
            title={t('settings.clearCache')}
            value={t('settings.cacheItems', { count: cacheItemCount })}
            onPress={handleClearCache}
            color="#FF4444"
            isLast
            colors={colors}
          />
        </SettingsSection>
        <SettingsSection title={t('settings.about')} colors={colors}>
          <SettingsRow icon="document-text-outline" title={t('settings.privacy')} onPress={() => {}} colors={colors} />
          <SettingsRow icon="mail-outline" title={t('settings.contact')} onPress={() => {}} colors={colors} />
          <SettingsRow icon="star-outline" title={t('settings.rate')} onPress={() => {}} isLast colors={colors} />
        </SettingsSection>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.appVersion')} 1.0.0 (Build 42)</Text>
          <Text style={styles.footerText}>{t('settings.developedWith')} ❤️ {t('settings.developedBy')}</Text>
          <Text style={styles.footerText}>support@scanapp.com</Text>
        </View>
      </ScrollView>
      <SelectionModal
        visible={themeModalVisible}
        title={t('settings.chooseTheme')}
        options={THEMES}
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
  scrollContainer: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  sectionContent: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rowNoBorder: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 15 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { fontSize: 16, marginRight: 10 },
  footer: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#555', fontSize: 14, marginBottom: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  modalOptionIcon: { marginRight: 15 },
  flagIcon: { fontSize: 22, marginRight: 15 },
  modalOptionText: { fontSize: 18 },
});
