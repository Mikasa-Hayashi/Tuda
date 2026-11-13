import { BADGE } from '@/src/components/BadgeLabel';
import { getAllMonumentPreviews } from '@/src/db/monumentRepository';
import { useTransitionDone } from '@/src/hooks/useTransitionDone';
import { getQuizMonumentIds, useQuizStoreVersion } from '@/src/offline/quizStore';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { useQuizProgress } from '@/src/storage/quizProgress';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  ContentUnavailableView,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Picker,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  lineLimit,
  pickerStyle,
  preferredColorScheme,
  shapes,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Filter = 'todo' | 'passed';

/** Quizzes of the selected city: not yet passed / passed, searchable by monument name. */
export default function QuizzesScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const results = useQuizProgress();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  const [cityId, setCityId] = useState<string | null | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>('todo');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getSelectedCityId()
      .then(setCityId)
      .catch(() => setCityId(null));
  }, []);

  // Read the local DB once, after the push transition, so the animation stays smooth.
  const quizVersion = useQuizStoreVersion();
  const transitionDone = useTransitionDone();
  const items = useMemo(() => {
    if (!transitionDone || !cityId) return null;
    const withQuiz = new Set(getQuizMonumentIds());
    return getAllMonumentPreviews(i18n.language, cityId)
      .filter((m) => withQuiz.has(m.id))
      .map((m) => ({ id: m.id, name: m.name }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- quizVersion re-reads the quiz store
  }, [transitionDone, cityId, i18n.language, quizVersion]);

  const passedCount = items?.filter((q) => results[q.id]?.passed).length ?? 0;
  const q = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      (items ?? []).filter(
        (m) =>
          !!results[m.id]?.passed === (filter === 'passed') &&
          (q === '' || m.name.toLowerCase().includes(q)),
      ),
    [items, results, filter, q],
  );

  const loading = items === null && cityId !== null;
  const noQuizzes = items !== null && items.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.SearchBar
        placement="stacked"
        placeholder={t('quizzes.searchPlaceholder')}
        autoCapitalize="none"
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch('')}
      />
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        {noQuizzes || cityId === null ? (
          <ContentUnavailableView
            title={t('quizzes.noQuizzes')}
            systemImage="questionmark.bubble"
            description={t('quizzes.noQuizzesHint')}
          />
        ) : (
          <Form>
            <Section>
              <Picker
                selection={filter}
                onSelectionChange={(v: Filter) => setFilter(v)}
                modifiers={[pickerStyle('segmented')]}
              >
                <Text modifiers={[tag('todo')]}>
                  {`${t('quizzes.todo')} · ${items ? items.length - passedCount : 0}`}
                </Text>
                <Text modifiers={[tag('passed')]}>
                  {`${t('quizzes.passed')} · ${passedCount}`}
                </Text>
              </Picker>
            </Section>
            <Section>
              {loading ? (
                <Text modifiers={[secondary]}>{t('quizzes.loading')}</Text>
              ) : visible.length === 0 ? (
                <Text modifiers={[secondary]}>
                  {q !== ''
                    ? t('quizzes.noResults')
                    : filter === 'todo'
                      ? t('quizzes.emptyTodo')
                      : t('quizzes.emptyPassed')}
                </Text>
              ) : (
                visible.map((m) => {
                  const r = results[m.id];
                  return (
                    <Button
                      key={m.id}
                      onPress={() =>
                        router.push({ pathname: '/quiz', params: { id: m.id, name: m.name } })
                      }
                      modifiers={[buttonStyle('plain')]}
                    >
                      <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                        <Text modifiers={[lineLimit(2)]}>{m.name}</Text>
                        <Spacer />
                        {r && <Text modifiers={[secondary]}>{`${r.score}/${r.total}`}</Text>}
                        {r?.passed && (
                          <SymbolImage
                            systemName="checkmark.circle.fill"
                            size={18}
                            color={BADGE.green}
                          />
                        )}
                        <SymbolImage
                          systemName="chevron.right"
                          size={12}
                          modifiers={[secondary, font({ weight: 'semibold' })]}
                        />
                      </HStack>
                    </Button>
                  );
                })
              )}
            </Section>
          </Form>
        )}
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
