import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AudioGuideScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const title = name ?? 'Аудиогид';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Аудиогид</Text>
          <View style={styles.navBtn} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.albumArt} />

        <Text style={styles.trackTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.trackSub}>Голос: ИИ-диктор · RU</Text>

        <View style={styles.offlineRow}>
          <Text style={styles.offlineText}>⤓ Скачать для офлайна</Text>
          <Text style={styles.offlineSize}>3.2 МБ</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>0:00</Text>
          <Text style={styles.timeText}>4:30</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.skipBtn}>
            <Text style={styles.skipText}>↺15</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={28} color="#1C1A17" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn}>
            <Text style={styles.skipText}>15↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1A17' },
  safeArea: { backgroundColor: '#1C1A17' },
  navBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  navBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  content: { flex: 1, paddingHorizontal: 22, alignItems: 'center', paddingTop: 18 },
  albumArt: {
    width: 180,
    height: 180,
    borderRadius: 24,
    backgroundColor: '#C8782A',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  trackSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 20 },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 24,
  },
  offlineText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  offlineSize: { color: '#9FE3C0', fontSize: 13, fontWeight: '600' },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    width: '42%',
    height: '100%',
    backgroundColor: '#C8782A',
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  timeText: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  skipBtn: { padding: 8 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 22 },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
