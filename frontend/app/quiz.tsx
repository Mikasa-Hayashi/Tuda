import { achievements } from '@/src/storage/achievements';
import { getQuizQuestions } from '@/src/data/quiz';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  ContentUnavailableView,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Picker,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  disabled,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowSeparator,
  lineLimit,
  pickerStyle,
  preferredColorScheme,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const CLEAR = '#00000000';
const GREEN = '#34C759';
const RED = '#FF3B30';

export default function QuizScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string; name: string }>();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');

  const questions = useMemo(
    () => (id ? getQuizQuestions({ monumentId: id, lang: i18n.language, t }) : []),
    [id, i18n.language, t],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  if (!id) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // No quiz for this monument.
  if (questions.length === 0) {
    return (
      <>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Host style={styles.container} modifiers={[scheme]}>
            <ContentUnavailableView
              title={t('quiz.unavailableTitle')}
              systemImage="questionmark.circle"
              description={t('quiz.unavailableText')}
              actions={<Button label={t('quiz.backToMonument')} onPress={() => router.back()} />}
            />
          </Host>
        </View>
      </>
    );
  }

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
  };

  const next = () => {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    if (index === questions.length - 1) {
      setFinished(true);
      achievements.recordQuiz(id ?? '');
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  };

  if (finished) {
    return (
      <>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
            <Form>
              <Section>
                <VStack
                  spacing={8}
                  modifiers={[
                    frame({ maxWidth: 10000, alignment: 'center' }),
                    listRowBackground(CLEAR),
                    listRowSeparator('hidden'),
                  ]}
                >
                  <SymbolImage systemName="trophy.fill" size={56} color="#FF9F0A" />
                  <Text modifiers={[font({ textStyle: 'title2', weight: 'bold' })]}>
                    {t('quiz.completedTitle')}
                  </Text>
                  <Text modifiers={[font({ textStyle: 'headline' }), secondary]}>
                    {t('quiz.score', { score, total: questions.length })}
                  </Text>
                </VStack>
              </Section>

              <Section title={t('quiz.review')}>
                {questions.map((q, i) => {
                  const ok = answers[i] === q.correctIndex;
                  return (
                    <HStack key={i} spacing={10}>
                      <SymbolImage
                        systemName={ok ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                        size={22}
                        color={ok ? GREEN : RED}
                      />
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'subheadline' }), lineLimit(3)]}>
                          {q.question}
                        </Text>
                        {!ok && (
                          <Text modifiers={[font({ textStyle: 'footnote' }), secondary]}>
                            {t('quiz.correctAnswer', { answer: q.options[q.correctIndex] })}
                          </Text>
                        )}
                      </VStack>
                      <Spacer />
                    </HStack>
                  );
                })}
              </Section>

              <Section>
                <Button label={t('quiz.retry')} systemImage="arrow.clockwise" onPress={restart} />
                <Button
                  label={t('quiz.backToMonument')}
                  systemImage="chevron.backward"
                  onPress={() => router.back()}
                />
              </Section>
            </Form>
          </Host>
        </View>
      </>
    );
  }

  const q = questions[index];

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          <Form>
            <Section>
              <VStack
                alignment="leading"
                spacing={8}
                modifiers={[
                  frame({ maxWidth: 10000, alignment: 'leading' }),
                  listRowBackground(CLEAR),
                  listRowSeparator('hidden'),
                ]}
              >
                <Text modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), secondary]}>
                  {t('quiz.progress', { current: index + 1, total: questions.length })}
                </Text>
                <ProgressView value={(index + 1) / questions.length} />
                <Text modifiers={[font({ textStyle: 'title2', weight: 'bold' }), lineLimit()]}>
                  {q.question}
                </Text>
              </VStack>
            </Section>

            <Section>
              <Picker
                selection={selected}
                onSelectionChange={(v: number | null) => setSelected(v)}
                modifiers={[pickerStyle('inline')]}
              >
                {q.options.map((option, i) => (
                  <Text key={`${index}-${i}`} modifiers={[tag(i)]}>
                    {option}
                  </Text>
                ))}
              </Picker>
            </Section>

            {/* Transparent spacer row: lets the list scroll clear of the floating button. */}
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

        <View
          pointerEvents="box-none"
          style={[styles.floating, { bottom: (initialWindowMetrics?.insets.bottom ?? 0) + 8 }]}
        >
          <Host style={styles.nextHost} modifiers={[scheme]}>
            <Button
              label={index === questions.length - 1 ? t('quiz.finish') : t('quiz.next')}
              systemImage={index === questions.length - 1 ? 'flag.checkered' : 'arrow.right'}
              onPress={next}
              modifiers={[
                buttonStyle('glassProminent'),
                controlSize('large'),
                frame({ maxWidth: 10000 }),
                disabled(selected === null),
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
  centered: { alignItems: 'center', justifyContent: 'center' },
  floating: { position: 'absolute', left: 20, right: 20 },
  nextHost: { height: 52 },
});
