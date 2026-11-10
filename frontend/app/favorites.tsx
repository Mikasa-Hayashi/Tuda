import { getAllMonumentPreviews } from '@/src/db/monumentRepository';
import { getAllRoutes } from '@/src/db/routeRepository';
import { useFavorites } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  ContentUnavailableView,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  lineLimit,
  preferredColorScheme,
} from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { monumentIds, routeIds } = useFavorites();
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');

  // Resolve ids to localized names (offline, from the local DB). Unknown ids are skipped.
  const monuments = useMemo(() => {
    const byId = new Map(getAllMonumentPreviews(i18n.language).map((m) => [m.id, m]));
    return monumentIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  }, [monumentIds, i18n.language]);

  const routes = useMemo(() => {
    const byId = new Map(getAllRoutes(i18n.language).map((r) => [r.id, r]));
    return routeIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  }, [routeIds, i18n.language]);

  const isEmpty = monuments.length === 0 && routes.length === 0;

  const row = (key: string, name: string, onPress: () => void) => (
    <Button key={key} onPress={onPress} modifiers={[buttonStyle('plain')]}>
      <HStack spacing={8}>
        <Text modifiers={[lineLimit(2)]}>{name}</Text>
        <Spacer />
        <SymbolImage systemName="chevron.right" size={12} color={colors.textMuted} />
      </HStack>
    </Button>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        {isEmpty ? (
          <ContentUnavailableView
            title={t('favorites.empty')}
            systemImage="heart"
            description={t('favorites.hint')}
          />
        ) : (
          <Form>
            {monuments.length > 0 && (
              <Section title={t('favorites.monuments')}>
                {monuments.map((m) =>
                  row(`m-${m.id}`, m.name, () =>
                    router.push({ pathname: '/info', params: { id: m.id } }),
                  ),
                )}
              </Section>
            )}
            {routes.length > 0 && (
              <Section title={t('favorites.routes')}>
                {routes.map((r) =>
                  row(`r-${r.id}`, r.name, () =>
                    router.push({ pathname: '/route-info', params: { id: r.id } }),
                  ),
                )}
              </Section>
            )}
          </Form>
        )}
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
