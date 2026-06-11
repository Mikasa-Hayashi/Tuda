import { getAllMonumentPreviews } from '@/src/db/monumentRepository';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { getSelectedCityId } from '@/src/storage/citySelection';

type TimeOption = 'couple' | 'half' | 'full';
type AgeOption = 'kids' | 'adults' | 'family';

const TIME_OPTIONS: { id: TimeOption; title: string; desc: string }[] = [
  { id: 'couple', title: 'Пара часов', desc: '2–3 объекта рядом' },
  { id: 'half', title: 'Полдня', desc: '4–6 объектов' },
  { id: 'full', title: 'Целый день', desc: 'Максимум впечатлений' },
];

const AGE_OPTIONS: { id: AgeOption; emoji: string; title: string; desc: string }[] = [
  { id: 'kids', emoji: '🧒', title: 'Для детей', desc: 'проще, игровая' },
  { id: 'adults', emoji: '🧑', title: 'Для взрослых', desc: 'подробно' },
  { id: 'family', emoji: '👨‍👩‍👧', title: 'Семья', desc: 'всем интересно' },
];

const TOPIC_OPTIONS = [
  { id: 'history', label: '⚔ История' },
  { id: 'architecture', label: '🏛 Архитектура' },
  { id: 'culture', label: '🎨 Культура' },
  { id: 'parks', label: '🌳 Парки' },
  { id: 'photo', label: '📷 Фото' },
];

const STEP_COUNT = 3;

function ProgressBar({ step, colors }: { step: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: i < step ? colors.primary : colors.separator },
          ]}
        />
      ))}
    </View>
  );
}

export default function AiRouteScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [timeChoice, setTimeChoice] = useState<TimeOption | null>(null);
  const [ageChoice, setAgeChoice] = useState<AgeOption | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['history']);

  const countMap: Record<TimeOption, number> = { couple: 3, half: 5, full: 8 };

  const generatedRoute = useMemo(() => {
    if (step !== 3 || !timeChoice) return [];
    const all = getAllMonumentPreviews(i18n.language, null);
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, countMap[timeChoice]);
  }, [step, timeChoice, i18n.language]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>
            {step === 3 ? 'Готово ✨' : 'Свой маршрут'}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressBar step={step} colors={colors} />

        {step === 1 && (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Сколько у вас времени?
            </Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Подберём столько объектов, сколько успеете.
            </Text>
            {TIME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setTimeChoice(opt.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: timeChoice === opt.id ? colors.primary : colors.border,
                    borderWidth: timeChoice === opt.id ? 2 : 1,
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={styles.optionCardRow}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{opt.title}</Text>
                  {timeChoice === opt.id && (
                    <View style={[styles.optionDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: timeChoice ? colors.primary : colors.cardElevated },
              ]}
              disabled={!timeChoice}
              onPress={() => setStep(2)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  { color: timeChoice ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Далее
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Для кого маршрут?</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Подстроим подачу и сложность под возраст.
            </Text>
            <View style={styles.ageRow}>
              {AGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setAgeChoice(opt.id)}
                  style={[
                    styles.ageCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: ageChoice === opt.id ? colors.primary : colors.border,
                      borderWidth: ageChoice === opt.id ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.ageEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.ageTitle, { color: colors.text }]}>{opt.title}</Text>
                  <Text style={[styles.ageDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.topicsTitle, { color: colors.text }]}>Темы</Text>
            <View style={styles.topicsRow}>
              {TOPIC_OPTIONS.map((topic) => {
                const active = selectedTopics.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => toggleTopic(topic.id)}
                    style={[
                      styles.topicPill,
                      {
                        backgroundColor: active ? colors.text : colors.card,
                        borderColor: active ? colors.text : colors.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.topicPillText,
                        { color: active ? colors.background : colors.textSecondary },
                      ]}
                    >
                      {topic.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: ageChoice ? colors.primary : colors.cardElevated },
              ]}
              disabled={!ageChoice}
              onPress={() => setStep(3)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  { color: ageChoice ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Собрать маршрут ✨
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderKicker}>
                Ваш маршрут · {ageChoice === 'kids' ? '🧒 для детей' : ageChoice === 'adults' ? '🧑 взрослых' : '👨‍👩‍👧 семьи'}
              </Text>
              <Text style={styles.resultHeaderTitle}>
                {generatedRoute.length} остановки
              </Text>
              <Text style={styles.resultHeaderMeta}>
                ~{timeChoice === 'couple' ? '2.5' : timeChoice === 'half' ? '5' : '8'} часа · пешком
              </Text>
            </View>

            <View style={styles.timeline}>
              <View style={[styles.timelineBar, { backgroundColor: colors.separator }]} />
              {generatedRoute.map((m, index) => (
                <View key={m.id} style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: index === 0 ? colors.primary : colors.text },
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
                    <Text style={[styles.timelineCardTitle, { color: colors.text }]} numberOfLines={1}>
                      {m.name}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>▶ Начать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>♡ Сохранить маршрут</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  progressRow: { flexDirection: 'row', gap: 6, marginVertical: 18 },
  progressSegment: { flex: 1, height: 4, borderRadius: 4 },
  stepTitle: { fontSize: 23, fontWeight: '800', marginBottom: 6 },
  stepDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  optionCard: {
    borderRadius: 14,
    padding: 15,
    marginBottom: 11,
  },
  optionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: { fontSize: 16, fontWeight: '700' },
  optionDot: { width: 10, height: 10, borderRadius: 5 },
  optionDesc: { fontSize: 13, marginTop: 2 },
  actionBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  ageRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  ageCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  ageEmoji: { fontSize: 28 },
  ageTitle: { fontSize: 13, fontWeight: '700', marginTop: 5, textAlign: 'center' },
  ageDesc: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  topicsTitle: { fontSize: 19, fontWeight: '800', marginBottom: 12 },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  topicPill: {
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  topicPillText: { fontSize: 14, fontWeight: '600' },
  resultHeader: {
    backgroundColor: '#C8782A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  resultHeaderKicker: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 5,
  },
  resultHeaderMeta: { color: 'rgba(255,255,255,0.88)', fontSize: 13, marginTop: 2 },
  timeline: { position: 'relative', paddingLeft: 8 },
  timelineBar: {
    position: 'absolute',
    left: 19,
    top: 12,
    bottom: 14,
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
  },
  timelineCardTitle: { fontSize: 15, fontWeight: '700' },
});
