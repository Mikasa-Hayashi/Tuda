import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListGroup, ListRow, SymbolIcon } from '@/src/components/ListGroup';
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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.largeTitle, { color: colors.text }]}>{t('profile.title')}</Text>

        <ListGroup style={styles.group}>
          <View style={styles.guest}>
            <SymbolIcon
              sf="person.crop.circle.fill"
              fallback="person-circle"
              size={60}
              color={colors.textMuted}
            />
            <View style={styles.guestText}>
              <Text style={[styles.guestTitle, { color: colors.text }]}>
                {t('profile.guestTitle')}
              </Text>
              <Text style={[styles.guestDesc, { color: colors.textSecondary }]}>
                {t('profile.guestDesc')}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <ListRow title={t('profile.loginButton')} accent />
        </ListGroup>

        <ListGroup style={styles.group}>
          <ListRow
            title={t('profile.settings')}
            icon={{ sf: 'gearshape.fill', fallback: 'settings', color: '#8E8E93' }}
            onPress={() => router.push('/settings')}
          />
          <ListRow
            title={t('profile.about')}
            icon={{ sf: 'info', fallback: 'information', color: '#007AFF' }}
            onPress={() => router.push('/about')}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.4,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  group: { marginBottom: 34 },
  guest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 92, marginRight: 20 },
  guestText: { flex: 1 },
  guestTitle: { fontSize: 20, fontWeight: '600' },
  guestDesc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
