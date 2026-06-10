import { ActionButton } from '@/src/components/ActionButton';
import { headerStyles } from '@/src/theme/headerStyles';
import { getRouteById } from '@/src/db/routeRepository';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';

const RouteInfoHeader = ({ onBack, colors }: { onBack(): void; colors: ReturnType<typeof useTheme>['colors'] }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>
      <View style={headerStyles.iconButton} />
    </View>
  </SafeAreaView>
);

export default function RouteInfoScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const route = getRouteById(id ?? '', i18n.language);

  if (!route) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <RouteInfoHeader onBack={() => router.back()} colors={colors} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RouteInfoHeader onBack={() => router.back()} colors={colors} />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: route.coverImageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroTextOverlay}>
            <Text style={styles.routeName}>{route.name}</Text>
            <Text style={styles.stopsHint}>{t('route_info.stopsCount', { count: route.stopCount })}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton
            icon="map"
            label={t('route_info.openOnMap')}
            onPress={() => router.push({ pathname: '/', params: { routeId: route.id } })}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('route_info.about')}</Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>{route.description}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('route_info.stops')}</Text>
          <View style={[styles.stopsCard, { backgroundColor: colors.card }]}>
            {route.stops.map((stop, index) => (
              <View
                key={stop.id}
                style={[
                  styles.stopRow,
                  index < route.stops.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.stopIndex, { color: colors.primary }]}>{index + 1}.</Text>
                <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  heroContainer: { alignItems: 'center', marginBottom: 20 },
  heroImage: { width, height: 320 },
  heroTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  routeName: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  stopsHint: { color: '#E0E0E0', fontSize: 15, fontWeight: '500' },
  actionRow: { paddingHorizontal: 20, marginBottom: 25 },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionText: { fontSize: 16, lineHeight: 24 },
  stopsCard: { borderRadius: 12, overflow: 'hidden' },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  stopIndex: { fontSize: 16, fontWeight: '700', width: 28 },
  stopName: { fontSize: 16, flex: 1 },
});
