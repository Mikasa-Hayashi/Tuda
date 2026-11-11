import { achievements } from '@/src/storage/achievements';
import PhotoLink from '@/src/components/PhotoLink';
import { getRouteById } from '@/src/db/routeRepository';
import { MAP_APPS, openRouteInMaps } from '@/src/services/routeInMaps';
import { activeRoute, useActiveRouteId } from '@/src/storage/activeRoute';
import { useFavorites } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
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
  buttonStyle,
  contentShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  preferredColorScheme,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const CLEAR = '#00000000';
/** Form rows are inset by the system's grouped-list margin on each side. */
const FORM_MARGIN = 16;

export default function RouteInfoScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const activeId = useActiveRouteId();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const favorites = useFavorites();

  const route = useMemo(() => getRouteById(id ?? '', i18n.language), [id, i18n.language]);
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const heroWidth = width - FORM_MARGIN * 2;
  const heroHeight = Math.round((heroWidth * 9) / 16);

  if (!route) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const isActive = activeId === route.id;
  const startRoute = () => {
    if (isActive) {
      activeRoute.set(null);
      return;
    }
    activeRoute.set(route.id);
    achievements.recordRouteStarted(route.id);
    // '/' would match the entry redirect screen (app/index.tsx) and restart the app: target the
    // map tab explicitly.
    router.navigate('/map');
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={favorites.isFavorite('route', route.id) ? 'heart.fill' : 'heart'}
          accessibilityLabel={
            favorites.isFavorite('route', route.id) ? t('favorites.remove') : t('favorites.add')
          }
          onPress={() => void favorites.toggle('route', route.id)}
        />
        <Stack.Toolbar.Menu
          icon="arrow.triangle.turn.up.right.diamond"
          title={t('route_info.openOnMap')}
        >
          {MAP_APPS.map((m) => (
            <Stack.Toolbar.MenuAction
              key={m.app}
              icon={m.icon as never}
              onPress={() => void openRouteInMaps(m.app, route.id)}
            >
              {m.name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          <Form>
            {/* Cover */}
            <Section>
              <HStack
                modifiers={[
                  listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
                  listRowBackground(CLEAR),
                ]}
              >
                <RNHostView matchContents>
                  <PhotoLink
                    uri={route.coverImageUrl}
                    style={{
                      width: heroWidth,
                      height: heroHeight,
                      borderRadius: 20,
                      backgroundColor: colors.cardElevated,
                    }}
                  />
                </RNHostView>
              </HStack>
            </Section>

            {/* Title, meta, description */}
            <Section>
              <VStack
                alignment="leading"
                spacing={6}
                modifiers={[
                  frame({ maxWidth: 10000, alignment: 'leading' }),
                  listRowBackground(CLEAR),
                  listRowSeparator('hidden'),
                ]}
              >
                <Text modifiers={[font({ textStyle: 'title', weight: 'bold' })]}>{route.name}</Text>
                {route.stopCount > 0 && (
                  <HStack spacing={5}>
                    <SymbolImage
                      systemName="mappin.and.ellipse"
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                      ]}
                    >
                      {t('route_info.stopsCount', { count: route.stopCount })}
                    </Text>
                  </HStack>
                )}
                {route.description ? (
                  <Text
                    modifiers={[
                      font({ textStyle: 'body' }),
                      foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                    ]}
                  >
                    {route.description}
                  </Text>
                ) : null}
              </VStack>
            </Section>

            {/* Stops */}
            {route.stops.length > 0 && (
              <Section title={t('route_info.stops')}>
                {route.stops.map((stop, index) => (
                  <Button
                    key={stop.id}
                    modifiers={[buttonStyle('plain')]}
                    onPress={() => router.push(`/info?id=${stop.id}`)}
                  >
                    <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
                      <SymbolImage
                        systemName={`${Math.min(index + 1, 50)}.circle.fill` as never}
                        size={26}
                        color={colors.primary}
                      />
                      <Text modifiers={[font({ textStyle: 'body' })]}>{stop.name}</Text>
                      <Spacer />
                      <SymbolImage systemName="chevron.right" size={13} color={colors.textMuted} />
                    </HStack>
                  </Button>
                ))}
              </Section>
            )}

            {/* Transparent spacer row: lets the last stop scroll clear of the floating button. */}
            <Section>
              <Spacer
                modifiers={[
                  frame({ height: 72 }),
                  listRowBackground(CLEAR),
                  listRowSeparator('hidden'),
                ]}
              />
            </Section>
          </Form>
        </Host>

        {/* Floating glass "Start route" button over the list. */}
        <View
          pointerEvents="box-none"
          style={[styles.floating, { bottom: (initialWindowMetrics?.insets.bottom ?? 0) + 8 }]}
        >
          <Host style={styles.startHost} modifiers={[scheme]}>
            <Button
              label={isActive ? t('route_info.endRoute') : t('route_info.startRoute')}
              systemImage={isActive ? 'stop.fill' : 'play.fill'}
              onPress={startRoute}
              modifiers={[
                buttonStyle('glassProminent'),
                controlSize('large'),
                frame({ maxWidth: 10000 }),
              ]}
            />
          </Host>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floating: { position: 'absolute', left: 20, right: 20 },
  startHost: { height: 52 },
});
