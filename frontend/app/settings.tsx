import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { ListGroup, ListHeader, ListRow } from '@/src/components/ListGroup';
import { pickOption } from '@/src/components/pickOption';
import { CITIES } from '@/src/data/cities';
import { notifyMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { clearMonumentCache, getLocalCacheItemCount } from '@/src/db/monumentRepository';
import { clearDownloadedCityIds, getSelectedCityId } from '@/src/storage/citySelection';
import { useTheme } from '@/src/theme/ThemeContext';

type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'en' | 'ru' | 'ar' | 'zh';

const THEMES: { id: ThemeType; label: string }[] = [
  { id: 'system', label: 'settings.theme_system' },
  { id: 'light', label: 'settings.theme_light' },
  { id: 'dark', label: 'settings.theme_dark' },
];

// Language names are shown in their own language, as in iOS.
const LANGUAGES: { id: LanguageType; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' },
  { id: 'ar', label: 'العربية' },
  { id: 'zh', label: '中文' },
];

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as LanguageType;
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('settings.title'),
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerTransparent: true,
          headerBlurEffect: 'systemMaterial',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerLargeTitleStyle: { color: colors.text },
          headerLargeStyle: { backgroundColor: colors.background },
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListHeader>{t('settings.preferences')}</ListHeader>
        <ListGroup style={styles.group}>
          <ListRow
            title={t('settings.language')}
            icon={{ sf: 'globe', fallback: 'globe', color: '#007AFF' }}
            value={LANGUAGES.find((l) => l.id === currentLanguage)?.label}
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
            title={t('citySelector.title')}
            icon={{ sf: 'mappin.circle.fill', fallback: 'location', color: '#FF3B30' }}
            value={selectedCityName}
            onPress={() => router.push('/select-city')}
          />
          <ListRow
            title={t('settings.theme')}
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
        </ListGroup>

        <ListHeader>{t('settings.storage')}</ListHeader>
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
  content: { paddingTop: 8, paddingBottom: 40 },
  group: { marginBottom: 28 },
});
