import { audioLang, type AudioLang } from '@/src/audio/audioFiles';
import { BADGE } from '@/src/components/BadgeLabel';
import { LANGUAGES } from '@/src/i18n/languages';
import { formatBytes } from '@/src/offline/format';
import {
  downloadCityPacks,
  usePacks,
  type DownloadProgress,
  type PackSelection,
} from '@/src/offline/packs';
import { fetchPackManifest, type PackManifest } from '@/src/services/monumentsApi';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  ProgressView,
  Section,
  Spacer,
  Text,
  Toggle,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  disabled,
  font,
  foregroundStyle,
  frame,
  preferredColorScheme,
} from '@expo/ui/swift-ui/modifiers';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

const AUDIO_ORDER: AudioLang[] = ['ru', 'en', 'ar', 'zh'];

/** Sheet opened from the cloud icon of a city: choose which packs to download for offline use. */
export default function DownloadCitySheet() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { city } = useLocalSearchParams<{ city: string }>();
  const packs = usePacks()[city ?? ''];
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  const [manifest, setManifest] = useState<PackManifest | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [sel, setSel] = useState<PackSelection>(() => ({
    places: true,
    routes: true,
    quizzes: true,
    audio: [audioLang(i18n.language)],
  }));

  useEffect(() => {
    if (!city) return;
    fetchPackManifest(city)
      .then(setManifest)
      .catch(() => setFailed(true));
  }, [city]);

  const total = useMemo(() => {
    if (!manifest) return 0;
    let bytes = 0;
    if (sel.places) bytes += manifest.places.bytes;
    if (sel.routes) bytes += manifest.routes.bytes;
    if (sel.quizzes) bytes += manifest.quizzes.bytes;
    for (const l of sel.audio) bytes += manifest.audio[l]?.bytes ?? 0;
    return bytes;
  }, [manifest, sel]);

  const nothing = !sel.places && !sel.routes && !sel.quizzes && sel.audio.length === 0;

  const start = async () => {
    if (!city) return;
    setBusy(true);
    try {
      await downloadCityPacks(city, sel, setProgress);
      router.back();
    } catch {
      Alert.alert(t('offline.failed'));
      setBusy(false);
      setProgress(null);
    }
  };

  const toggleAudio = (lang: AudioLang, on: boolean) =>
    setSel((s) => ({
      ...s,
      audio: on ? [...new Set([...s.audio, lang])] : s.audio.filter((l) => l !== lang),
    }));

  const done = (ok: boolean | undefined) =>
    ok ? <SymbolImage systemName="checkmark.circle.fill" size={16} color={BADGE.green} /> : null;

  const row = (
    label: string,
    detail: string,
    isOn: boolean,
    onChange: (v: boolean) => void,
    saved?: boolean,
  ) => (
    <HStack spacing={8}>
      <Toggle isOn={isOn} onIsOnChange={onChange} label={label} />
      <Spacer />
      {done(saved)}
      <Text modifiers={[font({ textStyle: 'footnote' }), secondary]}>{detail}</Text>
    </HStack>
  );

  const langLabel = (l: AudioLang) => LANGUAGES.find((x) => x.id === l)?.label ?? l;
  const label = progress
    ? `${t('offline.downloading')} ${progress.done}/${progress.total}`
    : t('offline.downloading');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section title={t('offline.downloadTitle')} footer={<Text>{t('offline.downloadFooter')}</Text>}>
            {!manifest ? (
              failed ? (
                <Text modifiers={[secondary]}>{t('offline.failed')}</Text>
              ) : (
                <ProgressView />
              )
            ) : (
              <>
                {row(
                  t('offline.photos'),
                  `${t('offline.placesCount', { count: manifest.places.count })} · ${formatBytes(manifest.places.bytes, t)}`,
                  sel.places,
                  (v) => setSel((s) => ({ ...s, places: v })),
                  packs?.places,
                )}
                {manifest.routes.count > 0 &&
                  row(
                    t('offline.routes'),
                    t('offline.routesCount', { count: manifest.routes.count }),
                    sel.routes,
                    (v) => setSel((s) => ({ ...s, routes: v })),
                    packs?.routes,
                  )}
                {manifest.quizzes.count > 0 &&
                  row(
                    t('offline.quizzes'),
                    `${t('offline.quizCount', { count: manifest.quizzes.count })} · ${formatBytes(manifest.quizzes.bytes, t)}`,
                    sel.quizzes,
                    (v) => setSel((s) => ({ ...s, quizzes: v })),
                    packs?.quizzes,
                  )}
              </>
            )}
          </Section>

          {manifest && (
            <Section title={t('offline.audio')}>
              {AUDIO_ORDER.filter((l) => (manifest.audio[l]?.count ?? 0) > 0).map((l) =>
                row(
                  langLabel(l),
                  `${t('offline.files', { count: manifest.audio[l].count })} · ${formatBytes(manifest.audio[l].bytes, t)}`,
                  sel.audio.includes(l),
                  (v) => toggleAudio(l, v),
                  packs?.audio?.includes(l),
                ),
              )}
            </Section>
          )}

          <Section>
            {busy ? (
              <HStack spacing={10}>
                <ProgressView />
                <Text modifiers={[secondary]}>{label}</Text>
              </HStack>
            ) : (
              <Button
                label={nothing ? t('offline.nothing') : t('offline.selected', { size: formatBytes(total, t) })}
                systemImage="icloud.and.arrow.down"
                onPress={() => void start()}
                modifiers={[
                  buttonStyle('glassProminent'),
                  controlSize('large'),
                  frame({ maxWidth: 10000 }),
                  disabled(nothing || !manifest),
                ]}
              />
            )}
          </Section>
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
