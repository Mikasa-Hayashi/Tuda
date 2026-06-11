import { getRouteById } from '@/src/db/routeRepository';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';

export default function RouteInfoScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const route = getRouteById(id ?? '', i18n.language);

  if (!route) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.floatBtn}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.heroWrap}>
          {route.coverImageUrl ? (
            <Image source={{ uri: route.coverImageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: '#9a6a3a' }]} />
          )}
          <View style={[styles.heroOverlay, StyleSheet.absoluteFill]} />
          <SafeAreaView edges={['top']} style={styles.heroNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.floatBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Pressable style={styles.floatBtn}>
              <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{route.name}</Text>
            <Text style={styles.heroMeta}>
              {route.stopCount > 0 ? t('route_info.stopsCount', { count: route.stopCount }) : ''}
            </Text>
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>▶ {t('route_info.startRoute')}</Text>
          </TouchableOpacity>

          {route.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
                {t('route_info.about')}
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {route.description}
              </Text>
            </View>
          ) : null}

          {route.stops.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
                {t('route_info.stops')}
              </Text>
              <View style={styles.timeline}>
                <View style={[styles.timelineBar, { backgroundColor: colors.separator }]} />
                {route.stops.map((stop, index) => (
                  <TouchableOpacity
                    key={stop.id}
                    onPress={() => router.push(`/info?id=${stop.id}`)}
                    style={styles.timelineRow}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: index === 0 ? colors.primary : colors.text,
                        },
                      ]}
                    >
                      <Text style={styles.timelineDotText}>{index + 1}</Text>
                    </View>
                    <View
                      style={[
                        styles.timelineCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.timelineCardTitle, { color: colors.text }]}>
                        {stop.name}
                      </Text>
                      <Text style={[styles.timelineCardHint, { color: colors.textMuted }]}>
                        🎧
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroWrap: { position: 'relative', height: 200 },
  heroImage: { width, height: 200 },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.35)' },
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 4,
  },
  content: { paddingHorizontal: 18, paddingTop: 18 },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  section: { marginBottom: 22 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  bodyText: { fontSize: 15, lineHeight: 24 },
  timeline: { position: 'relative', paddingLeft: 8 },
  timelineBar: {
    position: 'absolute',
    left: 19,
    top: 12,
    bottom: 24,
    width: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 14,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  timelineCard: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineCardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  timelineCardHint: { fontSize: 13 },
});
