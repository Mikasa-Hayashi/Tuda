import { AuthError } from '@/src/services/authApi';
import { auth } from '@/src/storage/auth';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  Button,
  Form,
  Host,
  Picker,
  Section,
  SecureField,
  Text,
  TextField,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled,
  foregroundStyle,
  frame,
  keyboardType,
  listRowBackground,
  listRowInsets,
  pickerStyle,
  preferredColorScheme,
  tag,
  textContentType,
  textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Mode = 'login' | 'register';

const ERROR_KEYS: Record<string, string> = {
  wrong_credentials: 'profile.auth.errWrong',
  taken: 'profile.auth.errTaken',
  invalid: 'profile.auth.errInvalid',
  network: 'profile.auth.errNetwork',
};

/** Sign-in / sign-up sheet: a native SwiftUI form, login or e-mail + password. */
export default function AuthScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheme = preferredColorScheme(isDark ? 'dark' : 'light');
  const plainInput = [autocorrectionDisabled(), textInputAutocapitalization('never')];
  const canSubmit = login.trim().length > 0 && password.length > 0 && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await auth.login(login, password);
      else await auth.register(login, email, password);
      router.back();
    } catch (e) {
      const code = e instanceof AuthError ? e.code : 'unknown';
      setError(t(ERROR_KEYS[code] ?? 'profile.auth.errUnknown'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{ title: t(mode === 'login' ? 'profile.auth.signIn' : 'profile.auth.signUp') }}
      />
      <Host style={styles.container} useViewportSizeMeasurement modifiers={[scheme]}>
        <Form>
          <Section>
            <Picker
              selection={mode}
              onSelectionChange={(id: string) => {
                setMode(id as Mode);
                setError(null);
              }}
              modifiers={[pickerStyle('segmented')]}
            >
              <Text modifiers={[tag('login')]}>{t('profile.auth.signIn')}</Text>
              <Text modifiers={[tag('register')]}>{t('profile.auth.signUp')}</Text>
            </Picker>
          </Section>

          <Section>
            <TextField
              placeholder={t(mode === 'login' ? 'profile.auth.login' : 'profile.auth.username')}
              onTextChange={setLogin}
              modifiers={[...plainInput, textContentType('username')]}
            />
            {mode === 'register' && (
              <TextField
                placeholder={t('profile.auth.email')}
                onTextChange={setEmail}
                modifiers={[
                  ...plainInput,
                  keyboardType('email-address'),
                  textContentType('emailAddress'),
                ]}
              />
            )}
            {/* SecureField ignores the plain `placeholder` prop on iOS: it needs the slot child. */}
            <SecureField
              onTextChange={setPassword}
              modifiers={[textContentType(mode === 'login' ? 'password' : 'newPassword')]}
            >
              <SecureField.Placeholder>
                <Text>{t('profile.auth.password')}</Text>
              </SecureField.Placeholder>
            </SecureField>
          </Section>

          {error && (
            <Section>
              <Text modifiers={[foregroundStyle('#FF3B30')]}>{error}</Text>
            </Section>
          )}

          <Section>
            {/* Full-width, centred label: the stretching Text sits inside the button, so the
                whole capsule fills the row; the row's own card background is cleared. */}
            <Button
              onPress={() => void submit()}
              modifiers={[
                buttonStyle('borderedProminent'),
                buttonBorderShape('capsule'),
                controlSize('large'),
                disabled(!canSubmit),
                listRowBackground('#00000000'),
                listRowInsets({ leading: 0, trailing: 0 }),
              ]}
            >
              <Text modifiers={[frame({ maxWidth: 10000 })]}>
                {t(mode === 'login' ? 'profile.auth.submitLogin' : 'profile.auth.submitRegister')}
              </Text>
            </Button>
          </Section>
        </Form>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
