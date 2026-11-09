import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { ListGroup, ListRow } from '@/src/components/ListGroup';
import { useNativeHeader } from '@/src/components/useNativeHeader';
import { LANGUAGES } from '@/src/i18n/languages';
import { useTheme } from '@/src/theme/ThemeContext';

export default function LanguageScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const headerOptions = useNativeHeader(t('settings.language'));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={headerOptions} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListGroup>
          {LANGUAGES.map((lang) => (
            <ListRow
              key={lang.id}
              title={lang.label}
              checked={i18n.language === lang.id}
              chevron={false}
              onPress={() => i18n.changeLanguage(lang.id)}
            />
          ))}
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 40 },
});
