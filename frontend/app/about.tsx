import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  HStack,
  RNHostView,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowSeparator,
  preferredColorScheme,
} from '@expo/ui/swift-ui/modifiers';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const CLEAR = '#00000000';
const ICON_SIZE = 84;

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // TODO: wire up the store review / contact / document links once the URLs exist.
  const row = (label: string, systemImage: 'star' | 'envelope' | 'lock' | 'doc.text') => (
    <Button
      label={label}
      systemImage={systemImage}
      onPress={() => {}}
      modifiers={[buttonStyle('plain')]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          {/* App identity */}
          <Section>
            <VStack
              spacing={6}
              modifiers={[
                frame({ maxWidth: 10000, alignment: 'center' }),
                listRowBackground(CLEAR),
                listRowSeparator('hidden'),
              ]}
            >
              <RNHostView matchContents>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={{ width: ICON_SIZE, height: ICON_SIZE, borderRadius: 19 }}
                  contentFit="cover"
                />
              </RNHostView>
              <Text modifiers={[font({ textStyle: 'title2', weight: 'bold' })]}>Туда</Text>
              <Text
                modifiers={[
                  font({ textStyle: 'footnote' }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}
              >
                {t('about.version')} {version}
              </Text>
            </VStack>
          </Section>

          <Section title={t('about.support')}>
            {row(t('about.rate'), 'star')}
            {row(t('about.contact'), 'envelope')}
          </Section>

          <Section title={t('about.documents')}>
            {row(t('about.privacy'), 'lock')}
            {row(t('about.terms'), 'doc.text')}
          </Section>

          <Section title={t('about.developers')}>
            <HStack>
              <Text>{t('about.developerTeam')}</Text>
              <Spacer />
            </HStack>
          </Section>
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
