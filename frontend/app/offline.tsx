import { BADGE } from '@/src/components/BadgeLabel';
import { CITIES } from '@/src/data/cities';
import { notifyMonumentCacheCleared } from '@/src/db/monumentCacheEvents';
import { formatBytes } from '@/src/offline/format';
import { deleteCity, getCityUsage, hasAnyPack, usePacks } from '@/src/offline/packs';
import { getDownloadedCityIds } from '@/src/storage/citySelection';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  ContentUnavailableView,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

/** Storage manager: cities with downloaded content, their sizes, delete one or everything. */
export default function OfflineScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const packs = usePacks();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  const [legacy, setLegacy] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getDownloadedCityIds()
        .then(setLegacy)
        .catch(() => {});
      setTick((n) => n + 1);
    }, []),
  );

  const rows = useMemo(() => {
    void tick;
    return CITIES.filter((c) => hasAnyPack(packs[c.id]) || legacy.includes(c.id)).map((c) => ({
      id: c.id,
      bytes: getCityUsage(c.id).totalBytes,
    }));
  }, [packs, legacy, tick]);

  const total = rows.reduce((sum, r) => sum + r.bytes, 0);

  const clearAll = () =>
    Alert.alert(t('offline.clearAll'), t('offline.clearAllMessage'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.clear'),
        style: 'destructive',
        onPress: async () => {
          for (const r of rows) await deleteCity(r.id);
          notifyMonumentCacheCleared();
          setLegacy([]);
          setTick((n) => n + 1);
        },
      },
    ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        {rows.length === 0 ? (
          <Form>
            <Section footer={<Text>{t('offline.coreNote')}</Text>}>
              <ContentUnavailableView
                title={t('offline.empty')}
                systemImage="icloud.and.arrow.down"
                description={t('offline.emptyHint')}
              />
            </Section>
          </Form>
        ) : (
          <Form>
            <Section
              title={t('offline.savedCities')}
              footer={<Text>{t('offline.coreNote')}</Text>}
            >
              {rows.map((r) => (
                <Button
                  key={r.id}
                  onPress={() => router.push({ pathname: '/offline-city', params: { city: r.id } })}
                  modifiers={[buttonStyle('plain')]}
                >
                  <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                    <SymbolImage systemName="mappin.circle.fill" size={20} color={BADGE.red} />
                    <Text>{t(`cities.${r.id}`)}</Text>
                    <Spacer />
                    <Text modifiers={[font({ textStyle: 'footnote' }), secondary]}>
                      {formatBytes(r.bytes, t)}
                    </Text>
                    <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
                  </HStack>
                </Button>
              ))}
              <HStack>
                <Text>{t('offline.total')}</Text>
                <Spacer />
                <Text modifiers={[secondary]}>{formatBytes(total, t)}</Text>
              </HStack>
            </Section>
            <Section>
              <Button role="destructive" label={t('offline.clearAll')} onPress={clearAll} />
            </Section>
          </Form>
        )}
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
