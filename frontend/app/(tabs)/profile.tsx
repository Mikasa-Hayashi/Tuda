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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';

export default function ProfileTabScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('profile.title')}</Text>

        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>{t('profile.guestTitle')}</Text>
          <Text style={styles.guestDesc}>{t('profile.guestDesc')}</Text>
          <TouchableOpacity style={styles.loginButton} activeOpacity={0.85}>
            <Text style={styles.loginButtonText}>{t('profile.loginButton')}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.actionsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.actionRow, { borderBottomColor: colors.separator }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>
              ⚙ {t('profile.settings')}
            </Text>
            <Text style={[styles.actionChevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/about')}
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>
              ℹ️ {t('profile.about')}
            </Text>
            <Text style={[styles.actionChevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  guestCard: {
    backgroundColor: '#C8782A',
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#8E4A12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  guestTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  guestDesc: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#1C1A17',
    fontSize: 15,
    fontWeight: '700',
  },
  actionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionText: { fontSize: 16 },
  actionChevron: { fontSize: 20, fontWeight: '300' },
});
