import { MONUMENT_TAG_IDS, TAG_STYLE } from '@/src/data/monumentFilterMeta';
import { overviewFilters, useOverviewTags } from '@/src/storage/overviewFilters';
import { useTheme } from '@/src/theme/ThemeContext';
import { Button, Form, Host, HStack, Image as SymbolImage, Section, Spacer, Toggle } from '@expo/ui/swift-ui';
import { background, foregroundStyle, frame, preferredColorScheme, shapes } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** Filter sheet of the Overview tab: stays open while tags are toggled; swipe down or tap outside to close. */
export default function OverviewFiltersSheet() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const selected = useOverviewTags();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section title={t('overview.filterTitle')}>
            {MONUMENT_TAG_IDS.map((tag) => (
              <HStack key={tag} spacing={10}>
                <SymbolImage
                  systemName={TAG_STYLE[tag].icon as React.ComponentProps<typeof SymbolImage>['systemName']}
                  size={14}
                  color="#FFFFFF"
                  modifiers={[
                    frame({ width: 28, height: 28 }),
                    background(TAG_STYLE[tag].color, shapes.roundedRectangle({ cornerRadius: 7 })),
                  ]}
                />
                <Toggle
                  isOn={selected.includes(tag)}
                  onIsOnChange={() => overviewFilters.toggle(tag)}
                  label={t(`overview.tags.${tag}`)}
                />
                <Spacer />
              </HStack>
            ))}
          </Section>
          {selected.length > 0 && (
            <Section>
              <Button
                role="destructive"
                label={t('overview.filterReset')}
                onPress={() => overviewFilters.clear()}
                modifiers={[foregroundStyle('#FF3B30')]}
              />
            </Section>
          )}
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
