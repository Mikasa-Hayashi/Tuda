import CoverImage from '@/src/components/CoverImage';
import { getMonumentById } from '@/src/db/monumentRepository';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Label,
  RNHostView,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  contentShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { scanNavigation } from '@/src/utils/scanNavigation';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

const CLEAR = '#00000000';
const FORM_MARGIN = 20;

/**
 * Result of a scan, as a native sheet over the camera: the recognised monument with its photo and
 * confidence and actions, or (when the model was unsure) the closest candidates to pick from.
 */
export default function ScanResultSheet() {
  const { id, p, alt } = useLocalSearchParams<{ id?: string; p?: string; alt?: string }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  const monument = useMemo(
    () => (id ? getMonumentById(id, i18n.language) : null),
    [id, i18n.language],
  );
  const candidates = useMemo(
    () =>
      (alt ?? '')
        .split(',')
        .map((pair) => pair.split(':'))
        .flatMap(([cid, cp]) => {
          const m = cid ? getMonumentById(cid, i18n.language) : null;
          return m ? [{ id: m.id, name: m.name, p: Number(cp) || 0 }] : [];
        }),
    [alt, i18n.language],
  );

  /** Closes the sheet; the camera screen then opens the target as a regular full-size screen. */
  const openAfterClose = (href: Href) => {
    scanNavigation.set(href);
    router.back();
  };
  const percent = Math.round((Number(p) || 0) * 100);
  const heroWidth = width - FORM_MARGIN * 2;

  // The model was unsure: let the user pick one of the closest matches.
  if (!monument) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          <Form>
            <Section
              title={t('scanResult.notFound')}
              footer={
                <Text modifiers={[font({ textStyle: 'footnote' })]}>{t('camera.notFoundHint')}</Text>
              }
            >
              {candidates.map((c) => (
                <Button
                  key={c.id}
                  onPress={() => openAfterClose({ pathname: '/info', params: { id: c.id } })}
                  modifiers={[buttonStyle('plain')]}
                >
                  <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                    <Text>{c.name}</Text>
                    <Spacer />
                    <Text modifiers={[secondary]}>{`${Math.round(c.p * 100)}%`}</Text>
                    <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
                  </HStack>
                </Button>
              ))}
            </Section>
          </Form>
        </Host>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section>
            <VStack
              alignment="leading"
              spacing={10}
              modifiers={[
                frame({ maxWidth: 10000, alignment: 'leading' }),
                listRowInsets({ top: 0, leading: 0, bottom: 12, trailing: 0 }),
                listRowBackground(CLEAR),
              ]}
            >
              <RNHostView matchContents>
                <CoverImage
                  source={monument.imageUrl ? { uri: monument.imageUrl } : undefined}
                  style={{
                    width: heroWidth,
                    height: Math.round(heroWidth * 0.52),
                    borderRadius: 20,
                    backgroundColor: colors.cardElevated,
                  }}
                  contentFit="cover"
                  contentPosition={{ top: 0, left: '50%' }}
                  cachePolicy="memory-disk"
                />
              </RNHostView>
              <Text modifiers={[font({ size: 24, weight: 'bold' })]}>{monument.name}</Text>
              <HStack spacing={6}>
                <SymbolImage systemName="checkmark.seal.fill" size={16} color="#34C759" />
                <Text modifiers={[font({ textStyle: 'subheadline' }), secondary]}>
                  {`${t('scanResult.recognized')} · ${t('scanResult.confidence')} ${percent}%`}
                </Text>
              </HStack>
            </VStack>
          </Section>

          <Section>
            <VStack
              spacing={10}
              modifiers={[
                listRowBackground(CLEAR),
                listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
              ]}
            >
              <Button
                onPress={() => openAfterClose({ pathname: '/info', params: { id: monument.id } })}
                modifiers={[
                  buttonStyle('glassProminent'),
                  buttonBorderShape('capsule'),
                  controlSize('large'),
                ]}
              >
                <Label
                  title={t('map.open')}
                  systemImage="arrow.up.right"
                  modifiers={[frame({ maxWidth: 10000 }), foregroundStyle('#FFFFFF')]}
                />
              </Button>
              <Button
                onPress={() =>
                  openAfterClose({
                    pathname: '/audio-guide',
                    params: {
                      id: monument.id,
                      name: monument.name,
                      image: monument.imageUrl ?? '',
                    },
                  })
                }
                modifiers={[
                  buttonStyle('glass'),
                  buttonBorderShape('capsule'),
                  controlSize('large'),
                ]}
              >
                <Label
                  title={t('info.audioGuide')}
                  systemImage="headphones"
                  modifiers={[frame({ maxWidth: 10000 })]}
                />
              </Button>
            </VStack>
          </Section>
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
