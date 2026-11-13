import { AUDIO_LANGS, type AudioLang } from '@/src/audio/audioFiles';
import { LANGUAGES } from '@/src/i18n/languages';
import { formatBytes } from '@/src/offline/format';
import {
  deleteCity,
  getCityUsage,
  removeAudio,
  removePhotos,
  removeQuizzes,
  usePacks,
} from '@/src/offline/packs';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import { font, foregroundStyle, preferredColorScheme } from '@expo/ui/swift-ui/modifiers';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

/** What is stored for one city, with a delete button per pack. */
export default function OfflineCityScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { city } = useLocalSearchParams<{ city: string }>();
  const packs = usePacks();
  const [tick, setTick] = useState(0);
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
  const footnote = font({ textStyle: 'footnote' });

  const usage = useMemo(() => {
    void packs;
    void tick;
    return city ? getCityUsage(city) : null;
  }, [city, packs, tick]);

  if (!city || !usage) return null;

  const confirm = (title: string, action: () => void | Promise<void>) =>
    Alert.alert(title, t('offline.deletePackTitle'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('offline.delete'),
        style: 'destructive',
        onPress: async () => {
          await action();
          setTick((n) => n + 1);
        },
      },
    ]);

  const info = (label: string, value: string) => (
    <HStack>
      <Text>{label}</Text>
      <Spacer />
      <Text modifiers={[footnote, secondary]}>{value}</Text>
    </HStack>
  );

  const langLabel = (l: AudioLang) => LANGUAGES.find((x) => x.id === l)?.label ?? l;
  const audioLangs = AUDIO_LANGS.filter((l) => usage.audio[l].count > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t(`cities.${city}`) }} />
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section footer={<Text>{t('offline.coreNote')}</Text>}>
            {info(t('offline.objects'), t('offline.objectsValue', { count: usage.monuments }))}
            {info(t('offline.routes'), String(usage.routes))}
            {info(t('offline.total'), formatBytes(usage.totalBytes, t))}
          </Section>

          <Section>
            {usage.photos.count > 0 ? (
              <>
                {info(
                  t('offline.photos'),
                  `${usage.photos.count} · ${formatBytes(usage.photos.bytes, t)}`,
                )}
                <Button
                  role="destructive"
                  label={`${t('offline.delete')}: ${t('offline.photos')}`}
                  onPress={() => confirm(t('offline.photos'), () => removePhotos(city))}
                />
              </>
            ) : (
              info(t('offline.photos'), t('offline.none'))
            )}
          </Section>

          <Section title={t('offline.audio')}>
            {audioLangs.length === 0
              ? info(t('offline.audio'), t('offline.none'))
              : audioLangs.map((l) => (
                  <HStack key={l}>
                    <Text>{langLabel(l)}</Text>
                    <Spacer />
                    <Text modifiers={[footnote, secondary]}>
                      {`${usage.audio[l].count} · ${formatBytes(usage.audio[l].bytes, t)}`}
                    </Text>
                    <Button
                      systemImage="trash"
                      role="destructive"
                      onPress={() => confirm(langLabel(l), () => removeAudio(city, l))}
                    />
                  </HStack>
                ))}
          </Section>

          <Section>
            {usage.quizzes.bytes > 0 ? (
              <>
                {info(
                  t('offline.quizzes'),
                  `${t('offline.quizCount', { count: usage.quizzes.count })} · ${formatBytes(usage.quizzes.bytes, t)}`,
                )}
                <Button
                  role="destructive"
                  label={`${t('offline.delete')}: ${t('offline.quizzes')}`}
                  onPress={() => confirm(t('offline.quizzes'), () => removeQuizzes(city))}
                />
              </>
            ) : (
              info(t('offline.quizzes'), t('offline.none'))
            )}
          </Section>

          <Section>
            <Button
              label={t('offline.downloadMore')}
              systemImage="icloud.and.arrow.down"
              onPress={() => router.push({ pathname: '/download-city', params: { city } })}
            />
            <Button
              role="destructive"
              label={t('offline.deleteCity')}
              onPress={() =>
                Alert.alert(t('offline.deleteCityTitle'), t('offline.deleteCityMessage'), [
                  { text: t('settings.cancel'), style: 'cancel' },
                  {
                    text: t('offline.delete'),
                    style: 'destructive',
                    onPress: async () => {
                      await deleteCity(city);
                      router.back();
                    },
                  },
                ])
              }
            />
          </Section>
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
