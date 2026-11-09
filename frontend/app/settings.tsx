import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { ListGroup, ListRow } from '@/src/components/ListGroup';
import { pickOption } from '@/src/components/pickOption';
import { CITIES } from '@/src/data/cities';
import { notifyMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { clearMonumentCache, getLocalCacheItemCount } from '@/src/db/monumentRepository';
import { LANGUAGES } from '@/src/i18n/languages';
import { clearDownloadedCityIds, getSelectedCityId } from '@/src/storage/citySelection';
import { useTheme } from '@/src/theme/ThemeContext';

type ThemeType = 'light' | 'dark' | 'system';

const THEMES: { id: ThemeType; label: string }[] = [
  { id: 'system', label: 'settings.theme_system' },
  { id: 'light', label: 'settings.theme_light' },
  { id: 'dark', label: 'settings.theme_dark' },
];

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [cacheItemCount, setCacheItemCount] = useState(0);
  const [selectedCityName, setSelectedCityName] = useState('');

  const refreshData = useCallback(() => {
    setCacheItemCount(getLocalCacheItemCount());
    getSelectedCityId().then((cityId) => {
      const city = CITIES.find((c) => c.id === cityId);
      setSelectedCityName(city ? t(`cities.${city.id}`) : '—');
    });
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData]),
  );

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListGroup style={styles.group}>
          <ListRow
            title={t('settings.language')}
            icon={{ sf: 'globe', fallback: 'globe', color: '#007AFF' }}
            value={LANGUAGES.find((l) => l.id === i18n.language)?.label}
            onPress={() =>
              pickOption({
                title: t('settings.chooseLanguage'),
                options: LANGUAGES,
                cancelLabel: t('settings.cancel'),
                onSelect: (id) => i18n.changeLanguage(id),
              })
            }
          />
          <ListRow
            title={t('settings.appearance')}
            icon={{ sf: 'circle.lefthalf.filled', fallback: 'contrast', color: '#5856D6' }}
            value={t(THEMES.find((th) => th.id === themeMode)?.label ?? '')}
            onPress={() =>
              pickOption({
                title: t('settings.chooseTheme'),
                options: THEMES.map((th) => ({ id: th.id, label: t(th.label) })),
                cancelLabel: t('settings.cancel'),
                onSelect: (id) => setThemeMode(id as ThemeType),
              })
            }
          />
          <ListRow
            title={t('citySelector.title')}
            icon={{ sf: 'mappin.circle.fill', fallback: 'location', color: '#FF3B30' }}
            value={selectedCityName}
            onPress={() => router.push('/select-city')}
          />
        </ListGroup>

        <ListGroup style={styles.group}>
          <ListRow
            title={t('settings.clearCache')}
            value={t('settings.cacheItems', { count: cacheItemCount })}
            onPress={handleClearCache}
            destructive
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 40 },
  group: { marginBottom: 28 },
});
