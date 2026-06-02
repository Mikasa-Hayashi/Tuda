import { generateMapHTML } from '@/src/map/generateMapHTML';
import { getAllMonumentPreviews, MonumentPreview } from '@/src/db/monumentRepository';
import { getResolvedRouteMapPoints, getRouteById } from '@/src/db/routeRepository';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getSelectedCityId } from '@/src/storage/citySelection';

const MapHeader = ({ onOverview, onCamera, colors, t }: { onOverview(): void; onCamera(): void; colors: any; t: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onOverview} style={headerStyles.iconButton}>
        <Ionicons name="list" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t('map.title')}</Text>

      <TouchableOpacity onPress={onCamera} style={headerStyles.iconButton}>
        <Ionicons name="camera" size={28} color={colors.primary} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const MonumentPreviewCard = ({
  monument,
  onClose,
  onDetails,
  t,
  colors,
}: {
  monument: MonumentPreview;
  onClose: () => void;
  onDetails: () => void;
  t: any;
  colors: any;
}) => (
  <View style={[styles.previewCardContainer, { backgroundColor: colors.card }]}>
    <TouchableOpacity style={[styles.closePreviewButton, { backgroundColor: colors.card }]} onPress={onClose}>
      <Ionicons name="close-circle" size={24} color="#A0A0A0" />
    </TouchableOpacity>
    <Image source={{ uri: monument.imageUrl }} style={styles.previewImage} />
    <View style={styles.previewInfo}>
      <View>
        <Text style={[styles.previewId, { color: colors.primary }]}>#{monument.id}</Text>
        <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
          {monument.name}
        </Text>
      </View>
      <TouchableOpacity style={[styles.detailsButton, { backgroundColor: colors.primary }]} onPress={onDetails}>
        <Text style={styles.detailsButtonText}>{t('map.details')}</Text>
        <Ionicons name="arrow-forward" size={16} color="black" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function MapTabScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const [selectedMonument, setSelectedMonument] = useState<MonumentPreview | null>(null);
  const lang = i18n.language;

  const activeRoute = useMemo(
    () => (routeId ? getRouteById(routeId, lang) : null),
    [routeId, lang],
  );

  const mapPoints = useMemo(() => {
    if (activeRoute) {
      return getResolvedRouteMapPoints(activeRoute.id, lang);
    }

    return getAllMonumentPreviews(lang, selectedCityId)
      .filter((m) => m.lat && m.lon)
      .map((m) => ({ id: m.id, lat: m.lat, lon: m.lon, name: m.name }));
  }, [activeRoute, lang, selectedCityId]);

  const html = useMemo(
    () =>
      generateMapHTML({
        points: mapPoints,
        useDrivingRoute: Boolean(activeRoute && mapPoints.length >= 2),
      }),
    [mapPoints, activeRoute],
  );

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_CLICK') {
        const allMonuments = getAllMonumentPreviews(lang, selectedCityId);
        const monument = allMonuments.find((m) => m.id === data.id);
        if (monument) setSelectedMonument(monument);
      }
    } catch (e) {
      console.log('Error parsing WebView message', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        setSelectedCityId(await getSelectedCityId());
      };
      load();
    }, []),
  );

  const exitRouteMode = () => {
    setSelectedMonument(null);
    router.replace('/');
  };

  const openRouteDetails = () => {
    if (routeId) router.push({ pathname: '/route-info', params: { id: routeId } });
  };

  const handleOpenOverview = () => {
    router.navigate('/overview');
  };

  const handleOpenCamera = () => {
    router.push('/camera');
  };

  const handleOnDetails = () => {
    if (selectedMonument) router.push(`/info?id=${selectedMonument.id}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <MapHeader onOverview={handleOpenOverview} onCamera={handleOpenCamera} colors={colors} t={t} />

      <View style={styles.mapWrapper}>
        {activeRoute && (
          <View style={[styles.routeChip, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={exitRouteMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.routeChipText, { color: colors.text }]} numberOfLines={1}>
              {activeRoute.name}
            </Text>
            <TouchableOpacity onPress={openRouteDetails} activeOpacity={0.85} style={styles.routeChipDetailsBtn}>
              <Text style={[styles.routeChipAction, { color: colors.primary }]}>{t('map.details')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <WebView
          key={`map-${routeId ?? 'all'}-${lang}`}
          ref={webviewRef}
          source={{ html }}
          style={styles.map}
          onMessage={handleWebViewMessage}
          scrollEnabled={false}
          bounces={false}
        />

        {selectedMonument && (
          <MonumentPreviewCard
            monument={selectedMonument}
            onClose={() => setSelectedMonument(null)}
            onDetails={handleOnDetails}
            t={t}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  mapWrapper: { flex: 1, position: 'relative' },
  map: { flex: 1, backgroundColor: 'black' },
  routeChip: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  routeChipText: { flex: 1, fontSize: 15, fontWeight: '700', marginHorizontal: 8 },
  routeChipAction: { fontSize: 14, fontWeight: '700' },
  routeChipDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  previewCardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  closePreviewButton: { position: 'absolute', top: -10, right: -10, borderRadius: 15, zIndex: 10 },
  previewImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#333' },
  previewInfo: { flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewId: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  previewTitle: { fontSize: 18, fontWeight: '700', maxWidth: 120 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  detailsButtonText: { color: 'black', fontWeight: 'bold', fontSize: 14 },
});
