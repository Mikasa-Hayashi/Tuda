import { authApi, AuthError, type AuthUser } from '@/src/services/authApi';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

/**
 * Signed-in account. The session (token + user) lives in the iOS keychain via SecureStore; the
 * app keeps working as a guest when there is none.
 */
type Session = { token: string; user: AuthUser };

const KEY = 'auth.session';
let session: Session | null = null;
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function setSession(next: Session | null): Promise<void> {
  session = next;
  emit();
  try {
    if (next) await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // keychain unavailable: the session just won't survive a restart
  }
}

SecureStore.getItemAsync(KEY)
  .then((raw) => {
    if (raw) session = JSON.parse(raw) as Session;
  })
  .catch(() => {})
  .finally(() => {
    ready = true;
    emit();
    // Drop a session the server no longer knows (account deleted elsewhere); keep it if offline.
    if (session) {
      authApi.me(session.token).catch((e) => {
        if (e instanceof AuthError && e.code === 'wrong_credentials') void setSession(null);
      });
    }
  });

export const auth = {
  login: async (identifier: string, password: string) =>
    setSession(await authApi.login(identifier.trim(), password)),
  register: async (username: string, email: string, password: string) =>
    setSession(await authApi.register(username.trim(), email.trim(), password)),
  logout: async () => {
    const token = session?.token;
    await setSession(null);
    if (token) await authApi.logout(token).catch(() => {});
  },
  deleteAccount: async () => {
    if (!session) return;
    await authApi.deleteAccount(session.token);
    await setSession(null);
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useAuth() {
  const current = useSyncExternalStore(subscribe, () => session);
  const isReady = useSyncExternalStore(subscribe, () => ready);
  return { user: current?.user ?? null, ready: isReady };
}
