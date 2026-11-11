import { getAllMonumentPreviews, type MonumentPreview } from '@/src/db/monumentRepository';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  List,
  Picker,
  Section,
  Spacer,
  SwipeActions,
  Text,
  Toggle,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  frame,
  contentShape,
  controlSize,
  environment,
  font,
  foregroundStyle,
  listRowBackground,
  listRowInsets,
  lineLimit,
  pickerStyle,
  preferredColorScheme,
  shapes,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const CLEAR = '#00000000';

type TimeOption = 'couple' | 'half' | 'full';
type AgeOption = 'kids' | 'adults' | 'family';

const TIME_OPTIONS: TimeOption[] = ['couple', 'half', 'full'];
const AGE_OPTIONS: AgeOption[] = ['kids', 'adults', 'family'];

const TOPICS = [
  { id: 'history', icon: 'clock.arrow.circlepath' },
  { id: 'architecture', icon: 'building.columns' },
  { id: 'culture', icon: 'theatermasks' },
  { id: 'parks', icon: 'tree' },
  { id: 'photo', icon: 'camera' },
] as const;

const STOP_COUNT: Record<TimeOption, number> = { couple: 3, half: 5, full: 8 };
const HOURS: Record<TimeOption, string> = { couple: '2.5', half: '5', full: '8' };

export default function AiRouteScreen() {
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');

  const [time, setTime] = useState<TimeOption>('half');
  const [age, setAge] = useState<AgeOption>('adults');
  const [topics, setTopics] = useState<string[]>(['history']);
  const [result, setResult] = useState<MonumentPreview[] | null>(null);
  const [editing, setEditing] = useState(false);

  const toggleTopic = (id: string, on: boolean) =>
    setTopics((prev) =>
      on ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id),
    );

  // Picks a random set of monuments sized to the available time (event handler, not render).
  const build = () => {
    const all = getAllMonumentPreviews(i18n.language, null);
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    setResult(shuffled.slice(0, STOP_COUNT[time]));
  };

  const removeStop = (id: string) =>
    setResult((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));

  // Swaps one stop for a random monument that isn't in the route yet.
  const replaceStop = (id: string) => {
    if (!result) return;
    const taken = new Set(result.map((m) => m.id));
    const pool = getAllMonumentPreviews(i18n.language, null).filter((m) => !taken.has(m.id));
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setResult(result.map((m) => (m.id === id ? pick : m)));
  };

  const moveStops = (sources: number[], destination: number) => {
    if (!result) return;
    const moved = sources.map((i) => result[i]);
    const rest = result.filter((_, i) => !sources.includes(i));
    const shift = sources.filter((i) => i < destination).length;
    rest.splice(destination - shift, 0, ...moved);
    setResult(rest);
  };

  const deleteStops = (indices: number[]) =>
    setResult((prev) => (prev ? prev.filter((_, i) => !indices.includes(i)) : prev));

  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

  return (
    <>
      <Stack.Title>{result ? t('aiRoute.ready') : t('aiRoute.title')}</Stack.Title>
      {result && result.length > 1 && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button onPress={() => setEditing((v) => !v)}>
            {editing ? t('aiRoute.done') : t('aiRoute.reorder')}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      <View style={styles.container}>
        <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
          {result ? (
            <Form
              modifiers={[environment({ key: 'editMode', value: editing ? 'active' : 'inactive' })]}
            >
              <Section>
                <Text modifiers={[font({ textStyle: 'headline' })]}>
                  {t('routesScreen.stopsCount', { count: result.length })}
                </Text>
                <Text modifiers={[font({ textStyle: 'subheadline' }), secondary]}>
                  {t('aiRoute.duration', { hours: HOURS[time] })} · {t(`aiRoute.age_${age}`)}
                </Text>
              </Section>

              <Section title={t('aiRoute.stops')}>
                <List.ForEach
                  data={result}
                  keyExtractor={(m) => m.id}
                  recycling={false}
                  onMove={moveStops}
                  onDelete={deleteStops}
                >
                  {({ item: m, index: i }) => (
                    <SwipeActions>
                      <Button
                        onPress={() => router.push({ pathname: '/info', params: { id: m.id } })}
                        modifiers={[buttonStyle('plain')]}
                      >
                        <HStack
                          spacing={10}
                          modifiers={[frame({ maxWidth: 10000 }), contentShape(shapes.rectangle())]}
                        >
                          <Text modifiers={[font({ weight: 'semibold' }), secondary]}>{i + 1}</Text>
                          <Text modifiers={[lineLimit(2)]}>{m.name}</Text>
                          <Spacer />
                          <SymbolImage systemName="chevron.right" size={12} color="#8E8E93" />
                        </HStack>
                      </Button>
                      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
                        <Button
                          label={t('aiRoute.remove')}
                          systemImage="trash"
                          role="destructive"
                          onPress={() => removeStop(m.id)}
                        />
                      </SwipeActions.Actions>
                      <SwipeActions.Actions edge="leading">
                        <Button
                          label={t('aiRoute.replace')}
                          systemImage="arrow.triangle.2.circlepath"
                          onPress={() => replaceStop(m.id)}
                        />
                      </SwipeActions.Actions>
                    </SwipeActions>
                  )}
                </List.ForEach>
              </Section>

              <Section>
                <Button
                  label={t('aiRoute.rebuild')}
                  systemImage="arrow.clockwise"
                  onPress={build}
                />
                <Button
                  label={t('aiRoute.edit')}
                  systemImage="slider.horizontal.3"
                  onPress={() => {
                    setEditing(false);
                    setResult(null);
                  }}
                />
              </Section>
            </Form>
          ) : (
            <Form>
              <Section title={t('aiRoute.timeTitle')}>
                <Picker
                  selection={time}
                  onSelectionChange={(v: TimeOption) => setTime(v)}
                  modifiers={[pickerStyle('inline')]}
                >
                  {TIME_OPTIONS.map((id) => (
                    <Text key={id} modifiers={[tag(id)]}>
                      {t(`aiRoute.time_${id}`)}
                    </Text>
                  ))}
                </Picker>
              </Section>

              <Section title={t('aiRoute.ageTitle')}>
                <Picker
                  selection={age}
                  onSelectionChange={(v: AgeOption) => setAge(v)}
                  modifiers={[pickerStyle('segmented')]}
                >
                  {AGE_OPTIONS.map((id) => (
                    <Text key={id} modifiers={[tag(id)]}>
                      {t(`aiRoute.age_${id}`)}
                    </Text>
                  ))}
                </Picker>
              </Section>

              <Section title={t('aiRoute.topicsTitle')}>
                {TOPICS.map((topic) => (
                  <Toggle
                    key={topic.id}
                    label={t(`aiRoute.topic_${topic.id}`)}
                    systemImage={topic.icon}
                    isOn={topics.includes(topic.id)}
                    onIsOnChange={(on) => toggleTopic(topic.id, on)}
                  />
                ))}
              </Section>

              <Section>
                <Button
                  onPress={build}
                  modifiers={[
                    buttonStyle('glassProminent'),
                    controlSize('large'),
                    listRowBackground(CLEAR),
                    listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
                  ]}
                >
                  {/* Spacers make the label (and so the button) span the full row. */}
                  <HStack spacing={8}>
                    <Spacer />
                    <SymbolImage systemName="sparkles" size={18} color="#FFFFFF" />
                    <Text>{t('aiRoute.build')}</Text>
                    <Spacer />
                  </HStack>
                </Button>
              </Section>
            </Form>
          )}
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
