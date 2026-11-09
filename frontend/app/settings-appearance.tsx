import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import {
  ListDivider,
  ListFooter,
  ListGroup,
  ListHeader,
  ListRow,
  SymbolIcon,
} from '@/src/components/ListGroup';
import { useNativeHeader } from '@/src/components/useNativeHeader';
import { useTheme } from '@/src/theme/ThemeContext';

type Scheme = 'light' | 'dark';

const PREVIEW = {
  light: { bg: '#CFE3F5', bar: 'rgba(255,255,255,0.55)', time: '#FFFFFF' },
  dark: { bg: '#0B1E4A', bar: 'rgba(255,255,255,0.18)', time: '#FFFFFF' },
} as const;

function Preview({
  scheme,
  label,
  selected,
  onPress,
}: {
  scheme: Scheme;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const p = PREVIEW[scheme];
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={styles.option}>
      <View style={[styles.phone, { backgroundColor: p.bg }]}>
        <Text style={[styles.time, { color: p.time }]}>09:41</Text>
        <View style={[styles.bar, { backgroundColor: p.bar }]} />
        <View style={[styles.bar, { backgroundColor: p.bar }]} />
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <SymbolIcon
        sf={selected ? 'checkmark.circle.fill' : 'circle'}
        fallback={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={26}
        color={selected ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );
}

export default function AppearanceScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { t } = useTranslation();
  const headerOptions = useNativeHeader(t('settings.appearance'));
  const automatic = themeMode === 'system';
  // In automatic mode the checkmark shows the scheme currently in effect.
  const current: Scheme = automatic ? (isDark ? 'dark' : 'light') : themeMode;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={headerOptions} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListHeader>{t('settings.appearance')}</ListHeader>
        <ListGroup style={styles.group}>
          <View style={styles.pickerRow}>
            <Preview
              scheme="light"
              label={t('settings.theme_light')}
              selected={current === 'light'}
              onPress={() => setThemeMode('light')}
            />
            <Preview
              scheme="dark"
              label={t('settings.theme_dark')}
              selected={current === 'dark'}
              onPress={() => setThemeMode('dark')}
            />
          </View>
          <ListDivider />
          <ListRow
            title={t('settings.automatic')}
            switchValue={automatic}
            onSwitchChange={(on) => setThemeMode(on ? 'system' : current)}
          />
        </ListGroup>
        <ListFooter>{t('settings.automaticFooter')}</ListFooter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 40 },
  group: { marginBottom: 28 },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 28,
    paddingBottom: 18,
  },
  option: { alignItems: 'center', gap: 10 },
  phone: {
    width: 70,
    height: 150,
    borderRadius: 14,
    alignItems: 'center',
    paddingTop: 18,
    gap: 6,
    overflow: 'hidden',
  },
  time: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  bar: { width: 58, height: 22, borderRadius: 7 },
  label: { fontSize: 17 },
});
