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
  fixedSize,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  multilineTextAlignment,
  padding,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

const CLEAR = '#00000000';
const FORM_MARGIN = 20;
const CANDIDATE_THUMB = 64;

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
          return m ? [{ id: m.id, name: m.name, imageUrl: m.imageUrl, p: Number(cp) || 0 }] : [];
        }),
    [alt, i18n.language],
  );

  /** Closes the sheet and the camera (a modal) beneath it, then pushes the target onto the main
   *  stack. Pushed over the camera modal, iOS would present it as a card instead of a screen. */
  const openAfterClose = (href: Href) => {
    router.dismiss(2);
    router.push(href);
  };
  const percent = Math.round((Number(p) || 0) * 100);
  const heroWidth = width - FORM_MARGIN * 2;

  // The model was unsure: let the user pick one of the closest matches.
  if (!monument) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          <Form>
            <Section>
              <VStack
                alignment="leading"
                spacing={4}
                modifiers={[
                  frame({ maxWidth: 10000, alignment: 'leading' }),
                  listRowInsets({ top: 4, leading: 0, bottom: 4, trailing: 0 }),
                  listRowBackground(CLEAR),
                ]}
              >
                <Text
                  modifiers={[
                    font({ size: 24, weight: 'bold' }),
                    multilineTextAlignment('leading'),
                    fixedSize({ horizontal: false, vertical: true }),
                    padding({ leading: 8, trailing: 8 }),
                  ]}
                >
                  {t('scanResult.pick')}
                </Text>
                <Text
                  modifiers={[
                    font({ textStyle: 'subheadline' }),
                    secondary,
                    multilineTextAlignment('leading'),
                    fixedSize({ horizontal: false, vertical: true }),
                    // The glyph at the start of a wrapped line was cut by the text bounds.
                    padding({ leading: 8, trailing: 8 }),
                  ]}
                >
                  {t('scanResult.pickHint')}
                </Text>
              </VStack>
            </Section>
            <Section>
              {candidates.map((c) => (
                <Button
                  key={c.id}
                  onPress={() => openAfterClose({ pathname: '/info', params: { id: c.id } })}
                  modifiers={[buttonStyle('plain')]}
                >
                  <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
                    <RNHostView matchContents>
                      {/* The photo is a React Native view: it must not swallow the row's tap. */}
                      <View pointerEvents="none">
                        <CoverImage
                          source={c.imageUrl ? { uri: c.imageUrl } : undefined}
                          style={{
                            width: CANDIDATE_THUMB,
                            height: CANDIDATE_THUMB,
                            borderRadius: 14,
                            backgroundColor: colors.cardElevated,
                          }}
                          contentFit="cover"
                          contentPosition={{ top: 0, left: '50%' }}
                          cachePolicy="memory-disk"
                        />
                      </View>
                    </RNHostView>
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[font({ textStyle: 'headline' })]}>{c.name}</Text>
                      <Text modifiers={[font({ textStyle: 'subheadline' }), secondary]}>
                        {`${t('scanResult.confidence')} ${Math.round(c.p * 100)}%`}
                      </Text>
                    </VStack>
                    <Spacer />
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
