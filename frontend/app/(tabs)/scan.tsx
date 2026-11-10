import { Button, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize } from '@expo/ui/swift-ui/modifiers';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

import { SymbolIcon } from '@/src/components/ListGroup';
import { useTheme } from '@/src/theme/ThemeContext';

export default function ScanTabScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SymbolIcon sf="camera.viewfinder" fallback="scan" size={96} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{t('scan.title')}</Text>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>{t('scan.desc')}</Text>
      <Host matchContents style={styles.button}>
        <Button
          label={t('scan.button')}
          systemImage="camera.fill"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push('/camera');
          }}
          modifiers={[buttonStyle('glassProminent'), controlSize('large')]}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  desc: { fontSize: 17, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: 20 },
});
