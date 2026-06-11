import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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
import { useTheme } from '../src/theme/ThemeContext';

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={[{ backgroundColor: colors.background }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>{t('about.title')}</Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoSymbol}>▲</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Туда</Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            {t('about.version')} 1.0.0
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
          {t('about.support')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.separator }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>⭐ {t('about.rate')}</Text>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <Text style={[styles.rowText, { color: colors.text }]}>✉️ {t('about.contact')}</Text>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
          {t('about.documents')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.separator }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>🔒 {t('about.privacy')}</Text>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <Text style={[styles.rowText, { color: colors.text }]}>📄 {t('about.terms')}</Text>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
          {t('about.developers')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={[styles.devText, { color: colors.textSecondary }]}>
              {t('about.developerTeam')}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', paddingVertical: 24 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#C8782A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoSymbol: { fontSize: 34, color: '#FFFFFF' },
  appName: { fontSize: 20, fontWeight: '800' },
  version: { fontSize: 13, marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { fontSize: 15 },
  chevron: { fontSize: 20, fontWeight: '300' },
  devText: { fontSize: 14, lineHeight: 22 },
});
