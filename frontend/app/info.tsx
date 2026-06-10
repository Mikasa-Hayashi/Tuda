import { ActionButton } from '@/src/components/ActionButton';
import { headerStyles } from '@/src/theme/headerStyles';
import { getMonumentById } from '@/src/db/monumentRepository';
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

const InfoHeader = ({ onBack, colors }: { onBack(): void; colors: ReturnType<typeof useTheme>['colors'] }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>
      <View style={headerStyles.iconButton} />
    </View>
  </SafeAreaView>
);

const MonumentHero = ({
  imageUrl,
  name,
  location,
  monumentId,
  colors,
}: {
  imageUrl: string;
  name: string;
  location: string;
  monumentId: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) => (
  <View style={styles.heroContainer}>
    <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
    <View style={styles.heroTextOverlay}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#{monumentId}</Text>
      </View>
      <Text style={styles.monumentName}>{name}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={16} color={colors.primary} />
        <Text style={styles.locationText}>{location}</Text>
      </View>
    </View>
  </View>
);

const InfoTable = ({
  title,
  data,
  colors,
}: {
  title: string;
  data: { label: string; value: string | null }[];
  colors: ReturnType<typeof useTheme>['colors'];
}) => (
  <View style={styles.sectionContainer}>
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
      {data.map((item, index) => (
        <View
          key={index}
          style={[
            styles.tableRow,
            index === data.length - 1 && styles.noBorder,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.tableLabel, { color: colors.text }]}>{item.label}</Text>
          <View style={styles.tableValueContainer}>
            <Text style={[styles.tableValue, { color: colors.textMuted }]}>{item.value ?? '—'}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

export default function MonumentDetailScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const monument = getMonumentById(id ?? '', i18n.language);

  if (!monument) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <InfoHeader onBack={() => router.back()} colors={colors} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <InfoHeader onBack={() => router.back()} colors={colors} />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <MonumentHero
          imageUrl={monument.imageUrl}
          name={monument.name}
          location={monument.location}
          monumentId={monument.id}
          colors={colors}
        />
        <View style={styles.actionRow}>
          <ActionButton icon="headset" label={t('info.audioGuide')} onPress={() => {}} />
        </View>
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('info.historyInfo')}</Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>{monument.description}</Text>
        </View>
        <InfoTable
          title={t('info.architectureDetails')}
          data={monument.details.map((item) => ({ label: t(item.labelKey), value: item.value }))}
          colors={colors}
        />
        <InfoTable
          title={t('info.tourismInfo')}
          data={monument.visitors.map((item) => ({ label: t(item.labelKey), value: item.value }))}
          colors={colors}
        />
        <View style={styles.actionRow}>
          <ActionButton
            icon="question-mark-circle"
            label={t('info.play_quiz')}
            onPress={() => router.push(`/quiz?id=${monument.id}&name=${monument.name}`)}
          />
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
  heroImage: { width, height: 380 },
  heroTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: { color: 'black', fontWeight: 'bold', fontSize: 14 },
  monumentName: { color: 'white', fontSize: 34, fontWeight: 'bold', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#E0E0E0', fontSize: 16, marginLeft: 4, fontWeight: '500' },
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
  tableContainer: { borderRadius: 12, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  noBorder: { borderBottomWidth: 0 },
  tableLabel: { fontSize: 16, flex: 1, paddingRight: 15 },
  tableValueContainer: { flex: 2, alignItems: 'flex-end' },
  tableValue: { fontSize: 16, textAlign: 'right', lineHeight: 22 },
});
