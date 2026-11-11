import {
  getAllMonumentPreviews,
  searchMonuments,
  type MonumentPreview,
} from '@/src/db/monumentRepository';
import { getResolvedRouteMapPoints, getRouteById } from '@/src/db/routeRepository';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { useCustomRoute } from '@/src/storage/customRoute';
import { MAP_MODES, setMapMode, useMapMode } from '@/src/storage/mapMode';
import { mapSelection, useMapSelection } from '@/src/storage/mapSelection';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  ContentUnavailableView,
  Form,
  Capsule,
  Host,
  Image as SymbolImage,
  HStack,
  Section,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  offset,
  preferredColorScheme,
  rotationEffect,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import * as Location from 'expo-location';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { activeRoute as activeRouteStore, useActiveRouteId } from '@/src/storage/activeRoute';
import { MAP_APPS, openRouteInMaps } from '@/src/services/routeInMaps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

/** Diameter of the round glass buttons on the map. */
const ROUND = 44;
/** Glyph size inside a round glass button; the glass style adds padding around it. */
const GLYPH = 30;
/** Side inset that lines the controls up with the header buttons (right) and the tab bar (left). */
const EDGE = 20;
/** Lifts the compass above Apple's logo and "Legal" link, which MapKit always draws bottom-left. */
const LEGAL_CLEARANCE = 44;
const DEFAULT_PIN = '#FF3B30';
const SELECTED_PIN = '#FF9500';
/** A second marker event this soon after the first is the system re-delivering the same tap. */
const MARKER_DEBOUNCE_MS = 700;
/** Two pins closer than this share of the visible span (about a pin's width) overlap on screen. */
const OVERLAP_FRACTION = 0.06;
/** Below this span (degrees, ~1 km) a tap always selects, so zooming in can't go on forever. */
const MIN_SEPARATE_DELTA = 0.01;
const ZOOM_STEP = 0.5;

/** Round glass button; its size comes from the glyph's frame, so every one comes out equal. */
function RoundButton({
  symbol,
  label,
  color,
  onPress,
}: {
  symbol: 'location' | 'plus' | 'minus';
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle('glass'), buttonBorderShape('circle'), accessibilityLabel(label)]}
    >
      <SymbolImage
        systemName={symbol}
        size={20}
        color={color}
        modifiers={[frame({ width: GLYPH, height: GLYPH })]}
      />
    </Button>
  );
}

const DIAL = 34;
const TICKS = Array.from({ length: 12 }, (_, i) => i);

/**
 * Compass like the one in Apple Maps: a glass disc with a ring of tick marks and a red marker
 * at north that turn with the map, and an upright "N" in the middle. Tap = north up.
 */
function CompassDial({
  heading,
  label,
  onPress,
}: {
  heading: number;
  label: string;
  onPress: () => void;
}) {
  const muted = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle('glass'), buttonBorderShape('circle'), accessibilityLabel(label)]}
    >
      <ZStack modifiers={[frame({ width: DIAL, height: DIAL })]}>
        {/* Ring: turns against the map rotation so the red marker always points to north. */}
        <ZStack modifiers={[frame({ width: DIAL, height: DIAL }), rotationEffect(-heading)]}>
          {TICKS.map((i) => (
            <ZStack
              key={i}
              modifiers={[frame({ width: DIAL, height: DIAL }), rotationEffect(i * 30)]}
            >
              {i === 0 ? (
                <SymbolImage
                  systemName="triangle.fill"
                  size={6}
                  color="#FF3B30"
                  modifiers={[offset({ y: -13 })]}
                />
              ) : (
                <Capsule
                  modifiers={[
                    frame({ width: 1, height: i % 3 === 0 ? 4 : 2 }),
                    offset({ y: -13 }),
                    muted,
                  ]}
                />
              )}
            </ZStack>
          ))}
        </ZStack>
        <Text modifiers={[font({ size: 13, weight: 'bold' })]}>N</Text>
      </ZStack>
    </Button>
  );
}

type Point = { id: string; lat: number; lon: number; name: string };

export default function MapTabScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language;
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const routeId = useActiveRouteId();

  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region | null>(null);
  // True for a short while after a marker tap (see MARKER_DEBOUNCE_MS).
  const markerLock = useRef(false);

  const custom = useCustomRoute();
  // Selection is shared with the place sheet (app/place.tsx).
  const { selectedId } = useMapSelection();
  const setSelectedId = mapSelection.select;
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const { mode, mapType } = useMapMode();
  // The map extends under the translucent header; keep the controls below it.
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  // Map rotation in degrees (0 = north up), for the compass.
  const [heading, setHeading] = useState(0);
  const [query, setQuery] = useState('');
  const [searchDismissed, setSearchDismissed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSelectedCityId().then(setSelectedCityId);
    }, []),
  );

  const activeRoute = useMemo(
    () => (routeId ? getRouteById(routeId, lang) : null),
    [routeId, lang],
  );

  const previews = useMemo(
    () => new Map(getAllMonumentPreviews(lang, selectedCityId).map((m) => [m.id, m])),
    [lang, selectedCityId],
  );

  const points = useMemo<Point[]>(() => {
    if (activeRoute) return getResolvedRouteMapPoints(activeRoute.id, lang);
    return [...previews.values()]
      .filter((m) => m.lat && m.lon)
      .map((m) => ({ id: m.id, lat: m.lat, lon: m.lon, name: m.name }));
  }, [activeRoute, lang, previews]);

  // The user's own route, drawn on top while it has 2+ stops (not while viewing a catalog route).
  const customPoints = useMemo<Point[]>(
    () =>
      activeRoute
        ? []
        : custom.ids.flatMap((id) => {
            const m = previews.get(id);
            return m ? [{ id: m.id, lat: m.lat, lon: m.lon, name: m.name }] : [];
          }),
    [activeRoute, custom.ids, previews],
  );

  // Frame everything whenever the set of points changes.
  useEffect(() => {
    if (points.length === 0) return;
    mapRef.current?.fitToCoordinates(
      points.map((p) => ({ latitude: p.lat, longitude: p.lon })),
      { edgePadding: { top: 80, right: 60, bottom: 160, left: 60 }, animated: true },
    );
  }, [points]);

  // A selection opens the place sheet and brings the pin into the visible part of the map.
  useEffect(() => {
    if (!selectedId) return;
    if (!mapSelection.get().sheetOpen) {
      mapSelection.setSheetOpen(true);
      router.push('/place');
    }
    const m = previews.get(selectedId);
    const r = regionRef.current;
    if (!m || !r) return;
    mapRef.current?.animateToRegion(
      {
        latitude: m.lat - r.latitudeDelta * 0.18,
        longitude: m.lon,
        latitudeDelta: r.latitudeDelta,
        longitudeDelta: r.longitudeDelta,
      },
      300,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const onMarkerPress = (id: string) => {
    if (markerLock.current) return;
    markerLock.current = true;
    setTimeout(() => {
      markerLock.current = false;
    }, MARKER_DEBOUNCE_MS);
    // Pins that overlap at this zoom can't be told apart: zoom in on the tapped one first, and
    // only select once the neighbours have separated (or we are already zoomed in far enough).
    const r = regionRef.current;
    const tapped = points.find((p) => p.id === id);
    if (r && tapped && r.latitudeDelta > MIN_SEPARATE_DELTA) {
      const crowded = points.some(
        (p) =>
          p.id !== id &&
          Math.abs(p.lat - tapped.lat) < r.latitudeDelta * OVERLAP_FRACTION &&
          Math.abs(p.lon - tapped.lon) < r.longitudeDelta * OVERLAP_FRACTION,
      );
      if (crowded) {
        mapRef.current?.animateToRegion(
          {
            latitude: tapped.lat,
            longitude: tapped.lon,
            latitudeDelta: Math.max(r.latitudeDelta * 0.25, MIN_SEPARATE_DELTA / 2),
            longitudeDelta: Math.max(r.longitudeDelta * 0.25, MIN_SEPARATE_DELTA / 2),
          },
          350,
        );
        return;
      }
    }
    setSelectedId(id);
  };

  const onMapPress = () => {
    // The map also reports the tap that landed on a marker; ignore it.
    if (markerLock.current) return;
    setSelectedId(null);
  };

  const zoom = (factor: number) => {
    const r = regionRef.current;
    if (!r) return;
    mapRef.current?.animateToRegion(
      { ...r, latitudeDelta: r.latitudeDelta * factor, longitudeDelta: r.longitudeDelta * factor },
      250,
    );
  };

  const goToMe = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== Location.PermissionStatus.GRANTED) return;
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (!pos) return;
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        350,
      );
    } catch {
      // location is optional
    }
  };

  const focusOn = (m: MonumentPreview) => {
    setSelectedId(m.id);
    mapRef.current?.animateToRegion(
      { latitude: m.lat, longitude: m.lon, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      350,
    );
  };

  const searchResults = useMemo(
    () => (query.trim() ? searchMonuments(query.trim(), lang, selectedCityId) : []),
    [query, lang, selectedCityId],
  );
  const showResults = query.trim() !== '' && !searchDismissed;

  return (
    <>
      <Stack.Title>{activeRoute?.name ?? t('tabs.map')}</Stack.Title>
      <Stack.SearchBar
        placement="integratedButton"
        placeholder={t('map.searchPlaceholder')}
        autoCapitalize="none"
        onChangeText={(e) => {
          setQuery(e.nativeEvent.text);
          setSearchDismissed(false);
        }}
        onCancelButtonPress={() => setQuery('')}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Menu icon="square.3.layers.3d" title={t('map.mapType')}>
          {MAP_MODES.map((m) => (
            <Stack.Toolbar.MenuAction
              key={m.id}
              icon={m.icon as never}
              isOn={mode === m.id}
              onPress={() => setMapMode(m.id)}
            >
              {t(m.label)}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {/* Direct children only: the toolbar does not look inside fragments. */}
      <Stack.Toolbar placement="right">
        {activeRoute && (
          <Stack.Toolbar.Button
            icon="info.circle"
            accessibilityLabel={t('map.routeDetails')}
            onPress={() => router.push({ pathname: '/route-info', params: { id: activeRoute.id } })}
          />
        )}
        {activeRoute && (
          <Stack.Toolbar.Menu
            icon="arrow.triangle.turn.up.right.diamond"
            title={t('route_info.openOnMap')}
          >
            {MAP_APPS.map((m) => (
              <Stack.Toolbar.MenuAction
                key={m.app}
                icon={m.icon as never}
                onPress={() => void openRouteInMaps(m.app, activeRoute.id)}
              >
                {m.name}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        )}
        {activeRoute && (
          <Stack.Toolbar.Button
            variant="done"
            accessibilityLabel={t('map.closeRoute')}
            onPress={() => {
              setSelectedId(null);
              activeRouteStore.set(null);
            }}
          >
            {t('map.finishRoute')}
          </Stack.Toolbar.Button>
        )}
        {!activeRoute && (
          <Stack.Toolbar.Button
            icon="point.topleft.down.to.point.bottomright.curvepath"
            accessibilityLabel={t('map.myRoute')}
            onPress={() => router.push('/ai-route')}
          />
        )}
      </Stack.Toolbar>

      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType={mapType}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          showsUserLocation
          showsCompass={false}
          pitchEnabled={false}
          onPress={onMapPress}
          onRegionChangeComplete={(r) => {
            regionRef.current = r;
            mapRef.current
              ?.getCamera()
              .then((c) => setHeading(c.heading ?? 0))
              .catch(() => {});
          }}
        >
          {points.map((p, index) => (
            <Marker
              key={`${p.id}-${index}`}
              coordinate={{ latitude: p.lat, longitude: p.lon }}
              pinColor={
                p.id === selectedId ? SELECTED_PIN : activeRoute ? colors.primary : DEFAULT_PIN
              }
              onPress={() => onMarkerPress(p.id)}
            />
          ))}
          {activeRoute && points.length >= 2 && (
            <Polyline
              coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lon }))}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          )}
          {customPoints.length >= 2 && (
            <Polyline
              coordinates={customPoints.map((p) => ({ latitude: p.lat, longitude: p.lon }))}
              strokeColor="#34C759"
              strokeWidth={4}
              lineDashPattern={[8, 6]}
            />
          )}
        </MapView>

        {/* Compass: like Apple Maps, only while the map is rotated; a tap turns north up. */}
        {Math.abs(heading) > 1 && (
          <View style={[styles.compass, { bottom: insets.bottom + LEGAL_CLEARANCE }]}>
            <Host style={styles.compassHost} modifiers={[scheme]}>
              <CompassDial
                heading={heading}
                label={t('map.compass')}
                onPress={() => mapRef.current?.animateCamera({ heading: 0 }, { duration: 300 })}
              />
            </Host>
          </View>
        )}

        {/* Map controls: map type, my location, zoom. */}
        <View style={[styles.controls, { top: headerHeight + 12 }]}>
          {/* Explicit size: a content-sized host measured too small and cut off the lower buttons. */}
          <Host style={styles.controlsHost} modifiers={[scheme]}>
            <VStack spacing={10}>
              <RoundButton
                symbol="location"
                label={t('map.myLocation')}
                color={colors.primary}
                onPress={() => void goToMe()}
              />
              <RoundButton
                symbol="plus"
                label={t('map.zoomIn')}
                color={colors.primary}
                onPress={() => zoom(ZOOM_STEP)}
              />
              <RoundButton
                symbol="minus"
                label={t('map.zoomOut')}
                color={colors.primary}
                onPress={() => zoom(1 / ZOOM_STEP)}
              />
            </VStack>
          </Host>
        </View>

        {/* Search results replace the map while there is a query, like the system Maps app. */}
        {showResults && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
            <Host style={styles.container} modifiers={[scheme]}>
              {searchResults.length === 0 ? (
                <ContentUnavailableView title={t('map.noResults')} systemImage="magnifyingglass" />
              ) : (
                <Form>
                  <Section>
                    {searchResults.map((m) => (
                      <Button
                        key={m.id}
                        onPress={() => {
                          setSearchDismissed(true);
                          focusOn(m);
                        }}
                        modifiers={[buttonStyle('plain'), buttonBorderShape('roundedRectangle')]}
                      >
                        <HStack
                          modifiers={[frame({ maxWidth: 10000 }), contentShape(shapes.rectangle())]}
                        >
                          <Text modifiers={[lineLimit(2)]}>{m.name}</Text>
                          <Spacer />
                        </HStack>
                      </Button>
                    ))}
                  </Section>
                </Form>
              )}
            </Host>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { position: 'absolute', right: EDGE },
  compass: { position: 'absolute', left: EDGE },
  roundHost: { width: ROUND, height: ROUND },
  compassHost: { width: ROUND, height: ROUND },
  controlsHost: { width: ROUND, height: 3 * ROUND + 2 * 10 },
});
