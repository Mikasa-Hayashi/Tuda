import { authApi, AuthError, type AuthUser } from '@/src/services/authApi';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { personalData, personalDataReady } from './personalData';

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

function applySession(next: Session | null): Promise<void> {
  session = next;
  let write = Promise.resolve();
  if (next) {
    write = personalData.setAccount(next.user.id, next.token, () => {
      if (session === next) void setSession(null);
    });
  } else {
    personalData.clearAccount();
  }
  emit();
  return write;
}

async function setSession(next: Session | null): Promise<void> {
  const write = applySession(next);
  try {
    if (next) await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // keychain unavailable: the session just won't survive a restart
  }
  await write;
}

const restoreSession = SecureStore.getItemAsync(KEY)
  .then((raw) => {
    const restored = raw ? JSON.parse(raw) as Partial<Session> | null : null;
    return typeof restored?.token === 'string' && typeof restored.user?.id === 'number'
      ? { token: restored.token, user: restored.user }
      : null;
  })
  .catch(() => null);

export const authReady = Promise.all([personalDataReady, restoreSession]).then(async ([, restored]) => {
  if (restored) await applySession(restored);
  ready = true;
  emit();
  // A session can belong to an account deleted on another device.
  if (restored) {
    authApi.me(restored.token).catch((error: unknown) => {
      if (session === restored && error instanceof AuthError && error.code === 'wrong_credentials') {
        void setSession(null);
      }
    });
  }
});

let logoutJob: Promise<void> | undefined;

async function logout(current: Session): Promise<void> {
  await personalData.flush();
  if (session === current) await setSession(null);
  await authApi.logout(current.token).catch(() => {});
}

export const auth = {
  login: async (identifier: string, password: string) =>
    setSession(await authApi.login(identifier.trim(), password)),
  register: async (username: string, email: string, password: string) =>
    setSession(await authApi.register(username.trim(), email.trim(), password)),
  logout: () => {
    if (!logoutJob && session) {
      logoutJob = logout(session).finally(() => { logoutJob = undefined; });
    }
    return logoutJob ?? Promise.resolve();
  },
  deleteAccount: async () => {
    const current = session;
    if (!current) return;
    await authApi.deleteAccount(current.token);
    if (session?.user.id === current.user.id) await setSession(null);
    await personalData.discardAccount(current.user.id);
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
