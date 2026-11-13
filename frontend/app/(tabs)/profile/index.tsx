import { BADGE } from '@/src/components/BadgeLabel';
import { useBadges, type BadgeState } from '@/src/storage/achievements';
import { auth, useAuth } from '@/src/storage/auth';
import { pickAvatar, removeAvatar, useAvatar } from '@/src/storage/avatar';
import { getMonumentById } from '@/src/db/monumentRepository';
import { QUIZ_MONUMENT_IDS } from '@/src/data/quizCurated';
import { useFavorites } from '@/src/storage/favorites';
import { useQuizProgress } from '@/src/storage/quizProgress';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Capsule,
  Form,
  Host,
  HStack,
  Image as SymbolImage,
  Label,
  Menu,
  RNHostView,
  Section,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  contentShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  multilineTextAlignment,
  listRowBackground,
  listRowInsets,
  preferredColorScheme,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

const AVATAR = 76;
const BADGE_SIZE = 54;
const PER_ROW = 4;

/** Row title with a plain coloured SF Symbol, as in Settings. */
const iconLabel = (
  title: string,
  systemName: React.ComponentProps<typeof SymbolImage>['systemName'],
  color: string,
) => <Label title={title} icon={<SymbolImage systemName={systemName} size={20} color={color} />} />;

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const favorites = useFavorites();
  const badges = useBadges(favorites.count);
  const avatarUri = useAvatar(user?.id ?? null);
  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
  const earned = badges.filter((b) => b.earned).length;

  // Quizzes whose monument is in the local DB, split by whether the user has passed them.
  const quizResults = useQuizProgress();
  const quizItems = useMemo(
    () =>
      QUIZ_MONUMENT_IDS.flatMap((id) => {
        const m = getMonumentById(id, i18n.language);
        return m ? [{ id, name: m.name }] : [];
      }),
    [i18n.language],
  );
  const passedQuizzes = quizItems.filter((q) => quizResults[q.id]?.passed);
  const todoQuizzes = quizItems.filter((q) => !quizResults[q.id]?.passed);

  const quizRow = (q: { id: string; name: string }) => {
    const r = quizResults[q.id];
    return (
      <Button
        key={q.id}
        onPress={() => router.push({ pathname: '/quiz', params: { id: q.id, name: q.name } })}
        modifiers={[buttonStyle('plain')]}
      >
        <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
          <Text modifiers={[lineLimit(2)]}>{q.name}</Text>
          <Spacer />
          {r && <Text modifiers={[secondary]}>{`${r.score}/${r.total}`}</Text>}
          {r?.passed && (
            <SymbolImage systemName="checkmark.circle.fill" size={18} color={BADGE.green} />
          )}
          <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
        </HStack>
      </Button>
    );
  };

  const showBadge = (b: BadgeState) =>
    Alert.alert(
      t(b.title),
      `${t(b.description)}\n\n${b.earned ? t('profile.earned') : `${b.current} / ${b.target}`}`,
    );

  const badgeCell = (b: BadgeState) => (
    <Button
      key={b.id}
      onPress={() => showBadge(b)}
      modifiers={[buttonStyle('plain'), frame({ maxWidth: 10000 })]}
    >
      <VStack
        spacing={6}
        modifiers={[frame({ maxWidth: 10000 }), contentShape(shapes.rectangle())]}
      >
        <ZStack modifiers={[frame({ width: BADGE_SIZE, height: BADGE_SIZE })]}>
          <Capsule
            modifiers={[
              frame({ width: BADGE_SIZE, height: BADGE_SIZE }),
              b.earned
                ? foregroundStyle(b.color)
                : foregroundStyle({ type: 'hierarchical', style: 'quaternary' }),
            ]}
          />
          <SymbolImage
            systemName={b.earned ? (b.icon as never) : 'lock.fill'}
            size={b.earned ? 24 : 18}
            color={b.earned ? '#FFFFFF' : colors.textMuted}
          />
        </ZStack>
        <Text
          modifiers={[
            font({ size: 11, weight: 'medium' }),
            multilineTextAlignment('center'),
            lineLimit(2),
            b.earned ? foregroundStyle({ type: 'hierarchical', style: 'primary' }) : secondary,
          ]}
        >
          {t(b.title)}
        </Text>
      </VStack>
    </Button>
  );

  const rows: BadgeState[][] = [];
  for (let i = 0; i < badges.length; i += PER_ROW) rows.push(badges.slice(i, i + PER_ROW));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Title>{t('profile.title')}</Stack.Title>
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          {/* Who is signed in: photo (tap to change), name, and the sign-in button for guests. */}
          <Section>
            <HStack spacing={16}>
              {/* Tap opens a native dropdown (like the map layers menu) with one action. */}
              <Menu
                label={
                  <RNHostView matchContents>
                    <View style={[styles.avatar, { backgroundColor: colors.cardElevated }]}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                      ) : (
                        <Image
                          source="sf:person.crop.circle.fill"
                          tintColor={colors.textMuted}
                          style={styles.avatarImage}
                        />
                      )}
                    </View>
                  </RNHostView>
                }
                modifiers={[buttonStyle('plain')]}
              >
                <Button
                  label={t(avatarUri ? 'profile.changePhoto' : 'profile.choosePhoto')}
                  systemImage="photo"
                  onPress={() => void pickAvatar(user?.id ?? null)}
                />
                {avatarUri && (
                  <Button
                    role="destructive"
                    label={t('profile.removePhoto')}
                    systemImage="trash"
                    onPress={() => void removeAvatar(user?.id ?? null)}
                  />
                )}
              </Menu>
              <VStack alignment="leading" spacing={2}>
                <Text modifiers={[font({ size: 22, weight: 'bold' })]}>
                  {user ? user.display_name : t('profile.guestTitle')}
                </Text>
                <Text modifiers={[font({ textStyle: 'subheadline' }), secondary, lineLimit(3)]}>
                  {user ? (user.email ?? `@${user.username}`) : t('profile.guestDesc')}
                </Text>
              </VStack>
              <Spacer />
            </HStack>
            {!user && (
              <Button
                onPress={() => router.push('/auth')}
                modifiers={[
                  buttonStyle('borderedProminent'),
                  buttonBorderShape('capsule'),
                  controlSize('large'),
                ]}
              >
                <Text modifiers={[frame({ maxWidth: 10000 })]}>{t('profile.loginButton')}</Text>
              </Button>
            )}
          </Section>

          {/* Badges: earned ones in colour, locked ones grey; tap for the goal and progress. */}
          <Section title={`${t('profile.badgesTitle')} · ${earned}/${badges.length}`}>
            <VStack spacing={14}>
              {rows.map((row, r) => (
                <HStack key={r} alignment="top" spacing={8}>
                  {row.map(badgeCell)}
                  {row.length < PER_ROW &&
                    Array.from({ length: PER_ROW - row.length }, (_, i) => (
                      <Spacer key={`pad-${i}`} modifiers={[frame({ maxWidth: 10000 })]} />
                    ))}
                </HStack>
              ))}
            </VStack>
          </Section>

          {quizItems.length > 0 && (
            <>
              <Section title={`${t('profile.quizzesPassed')} · ${passedQuizzes.length}`}>
                {passedQuizzes.length > 0 ? (
                  passedQuizzes.map(quizRow)
                ) : (
                  <Text modifiers={[secondary]}>{t('profile.quizzesEmpty')}</Text>
                )}
              </Section>
              <Section title={`${t('profile.quizzesTodo')} · ${todoQuizzes.length}`}>
                {todoQuizzes.length > 0 ? (
                  todoQuizzes.map(quizRow)
                ) : (
                  <Text modifiers={[secondary]}>{t('profile.quizzesEmpty')}</Text>
                )}
              </Section>
            </>
          )}

          <Section>
            <Button onPress={() => router.push('/favorites')} modifiers={[buttonStyle('plain')]}>
              <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                {iconLabel(t('favorites.title'), 'heart.fill', BADGE.red)}
                <Spacer />
                {favorites.count > 0 && (
                  <Text modifiers={[secondary]}>{String(favorites.count)}</Text>
                )}
                <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
              </HStack>
            </Button>
            <Button onPress={() => router.push('/settings')} modifiers={[buttonStyle('plain')]}>
              <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                {iconLabel(t('profile.settings'), 'gearshape.fill', BADGE.gray)}
                <Spacer />
                <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
              </HStack>
            </Button>
            <Button onPress={() => router.push('/about')} modifiers={[buttonStyle('plain')]}>
              <HStack spacing={8} modifiers={[contentShape(shapes.rectangle())]}>
                {iconLabel(t('profile.about'), 'info.circle.fill', BADGE.blue)}
                <Spacer />
                <SymbolImage systemName="chevron.right" size={12} modifiers={[secondary]} />
              </HStack>
            </Button>
          </Section>

          {/* Sign out: a grey liquid-glass button across the full width. */}
          {user && (
            <Section>
              <Button
                onPress={() => void auth.logout()}
                modifiers={[
                  buttonStyle('glass'),
                  buttonBorderShape('capsule'),
                  controlSize('large'),
                  tint(BADGE.gray),
                  listRowBackground('#00000000'),
                  listRowInsets({ leading: 0, trailing: 0 }),
                ]}
              >
                <Label
                  title={t('profile.auth.logout')}
                  systemImage="rectangle.portrait.and.arrow.right"
                  modifiers={[frame({ maxWidth: 10000 })]}
                />
              </Button>
            </Section>
          )}
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
  },
  avatarImage: { width: AVATAR, height: AVATAR },
});
