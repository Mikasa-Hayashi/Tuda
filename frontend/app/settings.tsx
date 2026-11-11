import { BADGE } from '@/src/components/BadgeLabel';
import { CITIES } from '@/src/data/cities';
import { notifyMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { clearMonumentCache, getLocalCacheItemCount } from '@/src/db/monumentRepository';
import { LANGUAGES } from '@/src/i18n/languages';
import { clearDownloadedCityIds, getSelectedCityId } from '@/src/storage/citySelection';
import { auth, useAuth } from '@/src/storage/auth';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Label,
  Picker,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  foregroundStyle,
  pickerStyle,
  preferredColorScheme,
  shapes,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

const THEMES: { id: ThemeType; label: string }[] = [
  { id: 'system', label: 'settings.theme_system' },
  { id: 'light', label: 'settings.theme_light' },
  { id: 'dark', label: 'settings.theme_dark' },
];

/** Row title with a plain coloured SF Symbol, as the old settings list had. */
const iconLabel = (
  title: string,
  systemName: React.ComponentProps<typeof SymbolImage>['systemName'],
  color: string,
) => <Label title={title} icon={<SymbolImage systemName={systemName} size={20} color={color} />} />;

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [cacheItemCount, setCacheItemCount] = useState(0);
  const [selectedCityName, setSelectedCityName] = useState('');
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

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

  const confirmDeleteAccount = () =>
    Alert.alert(t('profile.auth.deleteTitle'), t('profile.auth.deleteMessage'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('profile.auth.delete'),
        style: 'destructive',
        onPress: () => void auth.deleteAccount().catch(() => {}),
      },
    ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section>
            {/* Drop-down lists: title on the left, native menu Picker with the current value on the
                right (the title is not the Picker's own label, so the value never wraps). */}
            <HStack>
              {iconLabel(t('settings.language'), 'globe', BADGE.blue)}
              <Spacer />
              <Picker
                selection={i18n.language}
                onSelectionChange={(id: string) => void i18n.changeLanguage(id)}
                modifiers={[pickerStyle('menu')]}
              >
                {LANGUAGES.map((l) => (
                  <Text key={l.id} modifiers={[tag(l.id)]}>
                    {l.label}
                  </Text>
                ))}
              </Picker>
            </HStack>
            <HStack>
              {iconLabel(t('settings.appearance'), 'circle.lefthalf.filled', BADGE.indigo)}
              <Spacer />
              <Picker
                selection={themeMode}
                onSelectionChange={(id: string) => setThemeMode(id as ThemeType)}
                modifiers={[pickerStyle('menu')]}
              >
                {THEMES.map((th) => (
                  <Text key={th.id} modifiers={[tag(th.id)]}>
                    {t(th.label)}
                  </Text>
                ))}
              </Picker>
            </HStack>
            <Button onPress={() => router.push('/select-city')} modifiers={[buttonStyle('plain')]}>
              <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                {iconLabel(t('citySelector.title'), 'mappin.circle.fill', BADGE.red)}
                <Spacer />
                <Text modifiers={[secondary]}>{selectedCityName}</Text>
                <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
              </HStack>
            </Button>
          </Section>

          <Section>
            <Button
              role="destructive"
              label={`${t('settings.clearCache')} · ${t('settings.cacheItems', {
                count: cacheItemCount,
              })}`}
              onPress={handleClearCache}
            />
          </Section>
          {user && (
            <Section title={t('profile.account')}>
              <Button
                role="destructive"
                label={t('profile.auth.deleteAccount')}
                onPress={confirmDeleteAccount}
              />
            </Section>
          )}
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
