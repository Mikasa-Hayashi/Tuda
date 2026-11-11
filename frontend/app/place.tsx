import { getAllMonumentPreviews, getMonumentById } from '@/src/db/monumentRepository';
import { distanceKm } from '@/src/map/useUserLocation';
import { useCustomRoute } from '@/src/storage/customRoute';
import { mapSelection, useMapSelection } from '@/src/storage/mapSelection';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Label,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
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
  lineLimit,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { openOverSheet } from '@/src/utils/openOverSheet';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const CLEAR = '#00000000';
/** Pins this close share a spot on the map; they are listed here because taps cannot tell them apart. */
const SAME_PLACE_M = 40;

/**
 * Place sheet for the monument selected on the map: the same pattern as Apple Maps (a native
 * detent sheet over the map, which stays usable behind it at the lower detents).
 */
export default function PlaceSheet() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const custom = useCustomRoute();
  const { selectedId } = useMapSelection();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  useEffect(() => {
    mapSelection.setSheetOpen(true);
    return () => {
      mapSelection.setSheetOpen(false);
      mapSelection.select(null);
    };
  }, []);

  // Selection cleared on the map (tap on empty map): close the sheet.
  useEffect(() => {
    if (selectedId === null) router.back();
  }, [selectedId, router]);

  const monument = useMemo(
    () => (selectedId ? getMonumentById(selectedId, i18n.language) : null),
    [selectedId, i18n.language],
  );

  const neighbours = useMemo(() => {
    if (!monument) return [];
    return getAllMonumentPreviews(i18n.language, null).filter(
      (m) =>
        m.id !== monument.id &&
        distanceKm({ lat: m.lat, lon: m.lon }, { lat: monument.lat, lon: monument.lon }) * 1000 <
          SAME_PLACE_M,
    );
  }, [monument, i18n.language]);

  if (!monument) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const inRoute = custom.has(monument.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} modifiers={[scheme]}>
        <Form>
          <Section>
            <HStack
              spacing={14}
              modifiers={[
                listRowBackground(CLEAR),
                listRowSeparator('hidden'),
                listRowInsets({ top: 16 }),
              ]}
            >
              <RNHostView matchContents>
                <Image
                  source={{ uri: monument.imageUrl }}
                  style={[styles.thumb, { backgroundColor: colors.cardElevated }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </RNHostView>
              <VStack alignment="leading" spacing={4}>
                <Text modifiers={[font({ textStyle: 'title2', weight: 'bold' }), lineLimit(3)]}>
                  {monument.name}
                </Text>
                {monument.location ? (
                  <Text modifiers={[font({ textStyle: 'subheadline' }), secondary, lineLimit(2)]}>
                    {monument.location}
                  </Text>
                ) : null}
              </VStack>
              <Spacer />
            </HStack>
          </Section>

          <Section>
            <HStack
              spacing={10}
              modifiers={[
                listRowBackground(CLEAR),
                listRowSeparator('hidden'),
                listRowInsets({ top: 0, bottom: 0 }),
              ]}
            >
              {/* The stretching Label sits inside the button, so both glass shapes fill their half. */}
              <Button
                onPress={() =>
                  openOverSheet(router, { pathname: '/info', params: { id: monument.id } })
                }
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
                onPress={() => custom.toggle(monument.id)}
                modifiers={[
                  buttonStyle('glass'),
                  buttonBorderShape('capsule'),
                  controlSize('large'),
                ]}
              >
                <Label
                  title={inRoute ? t('map.inRoute') : t('map.addToRoute')}
                  systemImage={inRoute ? 'checkmark' : 'plus'}
                  modifiers={[
                    frame({ maxWidth: 10000 }),
                    foregroundStyle({ type: 'hierarchical', style: 'primary' }),
                  ]}
                />
              </Button>
            </HStack>
          </Section>

          {monument.description ? (
            <Section>
              <Text modifiers={[font({ textStyle: 'body' }), secondary, lineLimit(8)]}>
                {monument.description}
              </Text>
            </Section>
          ) : null}

          {neighbours.length > 0 && (
            <Section title={t('map.alsoHere', { count: neighbours.length })}>
              {neighbours.map((n) => (
                <Button
                  key={n.id}
                  onPress={() => mapSelection.select(n.id)}
                  modifiers={[buttonStyle('plain')]}
                >
                  <HStack
                    spacing={8}
                    modifiers={[frame({ maxWidth: 10000 }), contentShape(shapes.rectangle())]}
                  >
                    <Text modifiers={[lineLimit(2)]}>{n.name}</Text>
                    <Spacer />
                    <SymbolImage systemName="chevron.right" size={12} color={colors.textMuted} />
                  </HStack>
                </Button>
              ))}
            </Section>
          )}
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  thumb: { width: 72, height: 72, borderRadius: 16 },
});
