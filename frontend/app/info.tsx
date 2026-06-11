import { getMonumentById } from '@/src/db/monumentRepository';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function MonumentDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [descExpanded, setDescExpanded] = useState(false);

  const monument = getMonumentById(id ?? '', i18n.language);

  if (!monument) {
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

  const shortDesc = monument.description.slice(0, 200);
  const hasMore = monument.description.length > 200;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: monument.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />
          <SafeAreaView edges={['top']} style={styles.heroNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.floatBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.heroNavRight}>
              <Pressable style={styles.floatBtn}>
                <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.floatBtn}>
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </SafeAreaView>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{monument.name}</Text>
            {monument.location ? (
              <View style={styles.heroLocation}>
                <Ionicons name="location-sharp" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroLocationText}>{monument.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push(`/audio-guide?id=${monument.id}&name=${monument.name}`)}
          >
            <Text style={styles.primaryBtnText}>🎧 {t('info.audioGuide')}</Text>
          </TouchableOpacity>

          {monument.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
                {t('info.historyInfo')}
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {descExpanded ? monument.description : shortDesc}
                {!descExpanded && hasMore ? '…' : null}
              </Text>
              {hasMore && !descExpanded && (
                <TouchableOpacity onPress={() => setDescExpanded(true)}>
                  <Text style={[styles.readMore, { color: '#0A84FF' }]}>
                    {' '}{t('info.readMore')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {monument.details.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
                {t('info.architectureDetails')}
              </Text>
              <View
                style={[
                  styles.table,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {monument.details.map((item, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tableRow,
                      { borderBottomColor: colors.separator },
                      i === monument.details.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                      {t(item.labelKey)}
                    </Text>
                    <Text style={[styles.tableValue, { color: colors.text }]}>
                      {item.value ?? '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {monument.visitors.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.primaryDeep }]}>
                {t('info.tourismInfo')}
              </Text>
              <View
                style={[
                  styles.table,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {monument.visitors.map((item, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tableRow,
                      { borderBottomColor: colors.separator },
                      i === monument.visitors.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                      {t(item.labelKey)}
                    </Text>
                    <Text style={[styles.tableValue, { color: colors.text }]}>
                      {item.value ?? '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: colors.border }]}
            activeOpacity={0.75}
            onPress={() => router.push(`/quiz?id=${monument.id}&name=${monument.name}`)}
          >
            <Text style={[styles.ghostBtnText, { color: colors.text }]}>
              🏆 {t('info.play_quiz')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroWrap: { position: 'relative', height: 300 },
  heroImage: { width, height: 300 },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.18)' },
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
  heroNavRight: { flexDirection: 'row', gap: 10 },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  heroLocationText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    marginBottom: 10,
  },
  bodyText: { fontSize: 15, lineHeight: 24 },
  readMore: { fontSize: 15, fontWeight: '600' },
  table: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableLabel: { fontSize: 14, flex: 1, paddingRight: 12 },
  tableValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1 },
  ghostBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  ghostBtnText: { fontSize: 16, fontWeight: '700' },
});
