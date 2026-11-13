import { audioLang, type AudioLang } from '@/src/audio/audioFiles';
import { BADGE } from '@/src/components/BadgeLabel';
import { LANGUAGES } from '@/src/i18n/languages';
import { getAllMonumentPreviews } from '@/src/db/monumentRepository';
import { getQuizMonumentIds } from '@/src/offline/quizStore';
import { formatBytes } from '@/src/offline/format';
import {
  downloadCityPacks,
  getCityUsage,
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
  listRowBackground,
  listRowInsets,
  preferredColorScheme,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

const CLEAR = '#00000000';
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

  // Quizzes that ship with the app (core objects) need no download: nothing new = greyed out.
  const hasNewQuizzes = useMemo(() => {
    if (!manifest || !city) return false;
    const local = new Set(getQuizMonumentIds());
    const have = getAllMonumentPreviews('ru', city).filter((m) => local.has(m.id)).length;
    return manifest.quizzes.count > have || !!packs?.quizzes;
  }, [manifest, city, packs]);
  // Photos are complete when every object of the city already has its photo on the device.
  const photosDone = useMemo(() => {
    if (!manifest || !city || !packs?.places) return false;
    return getCityUsage(city).photos.count >= manifest.places.count;
  }, [manifest, city, packs]);
  const hasRoutes = (manifest?.routes.count ?? 0) > 0;

  const total = useMemo(() => {
    if (!manifest) return 0;
    let bytes = 0;
    if (sel.places && !photosDone) bytes += manifest.places.bytes;
    if (sel.routes && !packs?.routes) bytes += manifest.routes.bytes;
    if (sel.quizzes && hasNewQuizzes && !packs?.quizzes) bytes += manifest.quizzes.bytes;
    for (const l of sel.audio) if (!packs?.audio?.includes(l)) bytes += manifest.audio[l]?.bytes ?? 0;
    return bytes;
  }, [manifest, sel, packs, hasNewQuizzes, photosDone]);

  // Packs already on the device are shown as on and locked; only new ones count.
  const everythingDone =
    !!manifest &&
    photosDone &&
    (!hasRoutes || !!packs?.routes) &&
    (!hasNewQuizzes || !!packs?.quizzes) &&
    AUDIO_ORDER.every((l) => (manifest.audio[l]?.count ?? 0) === 0 || !!packs?.audio?.includes(l));
  const nothing =
    !(sel.places && !photosDone) &&
    !(sel.routes && !packs?.routes && hasRoutes) &&
    !(sel.quizzes && hasNewQuizzes && !packs?.quizzes) &&
    !sel.audio.some((l) => !packs?.audio?.includes(l));

  const start = async () => {
    if (!city) return;
    setBusy(true);
    try {
      // Only what the city really has: no routes or new quizzes means nothing to fetch.
      await downloadCityPacks(
        city,
        { ...sel, routes: sel.routes && hasRoutes, quizzes: sel.quizzes && hasNewQuizzes },
        setProgress,
      );
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
    unavailable?: boolean,
  ) => (
    <HStack key={label} spacing={8}>
      <Toggle
        isOn={isOn}
        onIsOnChange={onChange}
        label={label}
        modifiers={unavailable ? [disabled(true), secondary] : []}
      />
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
    <>
      <Stack.Title>{t('offline.downloadTitle')}</Stack.Title>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section footer={<Text>{t('offline.downloadFooter')}</Text>}>
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
                  sel.places || photosDone,
                  (v) => setSel((s) => ({ ...s, places: v })),
                  photosDone,
                  photosDone,
                )}
                {row(
                  t('offline.routes'),
                  manifest.routes.count > 0
                    ? t('offline.routesCount', { count: manifest.routes.count })
                    : t('offline.none'),
                  (sel.routes && manifest.routes.count > 0) || (hasRoutes && !!packs?.routes),
                  (v) => setSel((s) => ({ ...s, routes: v })),
                  hasRoutes && packs?.routes,
                  manifest.routes.count === 0 || !!packs?.routes,
                )}
                {row(
                  t('offline.quizzes'),
                  hasNewQuizzes
                    ? `${t('offline.quizCount', { count: manifest.quizzes.count })} · ${formatBytes(manifest.quizzes.bytes, t)}`
                    : t('offline.none'),
                  (sel.quizzes && hasNewQuizzes) || !!packs?.quizzes,
                  (v) => setSel((s) => ({ ...s, quizzes: v })),
                  packs?.quizzes,
                  !hasNewQuizzes || !!packs?.quizzes,
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
                  sel.audio.includes(l) || !!packs?.audio?.includes(l),
                  (v) => toggleAudio(l, v),
                  packs?.audio?.includes(l),
                  !!packs?.audio?.includes(l),
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
                onPress={() => void start()}
                modifiers={[
                  buttonStyle('glassProminent'),
                  controlSize('large'),
                  disabled(nothing || !manifest),
                  listRowBackground(CLEAR),
                  listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
                ]}
              >
                {/* Spacers make the label (and so the button) span the full row. */}
                <HStack spacing={8}>
                  <Spacer />
                  <SymbolImage systemName="icloud.and.arrow.down" size={18} color="#FFFFFF" />
                  <Text>
                    {nothing ? (everythingDone ? t('offline.allDone') : t('offline.nothing')) : t('offline.selected', { size: formatBytes(total, t) })}
                  </Text>
                  <Spacer />
                </HStack>
              </Button>
            )}
          </Section>
        </Form>
      </Host>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
