import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLiteStorage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { authApi, AuthError } from '@/src/services/authApi';
import { mergePersonalData } from './mergePersonalData';
import {
  EMPTY_PERSONAL_DATA,
  MAX_SCAN_ENTRIES,
  personalEntryId,
  type PersonalData,
  type PersonalDataWrite,
  type ScanRecord,
} from './personalDataTypes';
import { deleteScanPhotos } from './scanPhotos';

type AccountData = {
  revision: number;
  synced: PersonalData;
  data: PersonalData;
  inFlight?: PersonalDataWrite;
};
type LocalData = { deviceId: string; guest: PersonalData; accounts: Record<string, AccountData> };
type SyncSession = {
  userId: number;
  token: string;
  onUnauthorized: () => void;
  synced: boolean;
  retryDelay: number;
  job?: Promise<void>;
};

const KEY = 'personalData.v1';
const REFRESH_INTERVAL = 30_000;
const INITIAL_RETRY = 2_000;
const MAX_RETRY = 60_000;
const EDIT_DELAY = 250;
const MAX_SYNC_ROUNDS = 4;
const LEGACY_KEYS = {
  monumentFavorites: 'favorites.monumentIds',
  routeFavorites: 'favorites.routeIds',
  savedRoutes: 'savedRoutes.v1',
  customRoute: 'customRoute.monumentIds',
  achievements: 'achievements.v1',
  quizzes: 'quizProgress.v1',
  scans: 'scanHistory.v1',
} satisfies Record<keyof PersonalData, string>;

let local: LocalData = { deviceId: personalEntryId(Date.now()), guest: EMPTY_PERSONAL_DATA, accounts: {} };
let active: SyncSession | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let pendingWrite = Promise.resolve();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function persist(): Promise<void> {
  const snapshot = JSON.stringify(local);
  pendingWrite = pendingWrite.then(() => SQLiteStorage.setItem(KEY, snapshot)).catch(() => {});
  return pendingWrite;
}

function parseLegacy<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T | null) ?? fallback : fallback;
  } catch {
    return fallback;
  }
}

export const personalDataReady = (async () => {
  const raw = await SQLiteStorage.getItem(KEY);
  if (raw) {
    local = JSON.parse(raw) as LocalData;
    return;
  }

  const legacy = new Map(await AsyncStorage.multiGet(Object.values(LEGACY_KEYS)));
  const empty = EMPTY_PERSONAL_DATA;
  const read = <K extends keyof PersonalData>(key: K) => parseLegacy(legacy.get(LEGACY_KEYS[key]), empty[key]);
  const readIds = (key: 'monumentFavorites' | 'routeFavorites' | 'customRoute') => {
    const value = read(key);
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
  };
  const scans = read('scans');
  local.guest = {
    monumentFavorites: readIds('monumentFavorites'),
    routeFavorites: readIds('routeFavorites'),
    savedRoutes: read('savedRoutes'),
    customRoute: readIds('customRoute'),
    achievements: { ...empty.achievements, ...read('achievements') },
    quizzes: read('quizzes'),
    // Keep legacy IDs so the existing files can still be found by their names.
    scans: Array.isArray(scans) ? scans.slice(0, MAX_SCAN_ENTRIES).filter(Boolean)
      .map(({ id, monumentId, confidence, recognized, at }) => ({ id, monumentId, confidence, recognized, at })) : [],
  };
  await persist();
})().catch(() => {});

function getData(): PersonalData {
  return active ? local.accounts[active.userId].data : local.guest;
}

function sameData(a: PersonalData, b: PersonalData): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function hasPendingData(account: AccountData): boolean {
  return !!account.inFlight || !sameData(account.data, account.synced);
}

function removeUnusedPhotos(previous: readonly ScanRecord[], current: readonly ScanRecord[]) {
  if (previous === current) return;
  const retained = new Set(current.map(({ id }) => id));
  deleteScanPhotos(previous.filter(({ id }) => !retained.has(id)));
}

function stopTimer() {
  clearTimeout(timer);
  timer = undefined;
}

function scheduleSync(delay: number) {
  stopTimer();
  const session = active;
  if (session && AppState.currentState !== 'background' && AppState.currentState !== 'inactive') {
    timer = setTimeout(() => { void sync(session); }, delay);
  }
}

async function exchange(session: SyncSession): Promise<void> {
  const account = local.accounts[session.userId];
  for (let round = 0; round < MAX_SYNC_ROUNDS && active === session; round++) {
    if (!account.inFlight && hasPendingData(account)) {
      account.inFlight = {
        id: personalEntryId(Date.now()),
        deviceId: local.deviceId,
        data: account.data,
      };
      // Save the exact request so a retry can recognize a write whose response was lost.
      await persist();
      if (active !== session) return;
    }
    const write = account.inFlight ?? null;
    const result = await authApi.syncProgress(session.token, account.revision, write);
    if (active !== session) return;

    const current = account.data;
    const remote = result.data ?? account.synced;
    const base = result.applied && write ? write.data : account.synced;
    const merged = sameData(base, current) ? remote : mergePersonalData(base, current, remote);
    const changed = !sameData(current, merged);
    const stillDirty = !sameData(merged, remote);
    if (write || changed || result.revision !== account.revision) {
      if (changed) removeUnusedPhotos(current.scans, merged.scans);
      account.data = changed ? merged : current;
      account.synced = remote;
      account.revision = result.revision;
      account.inFlight = undefined;
      void persist();
      if (changed) notify();
    }
    if (!stillDirty) return;
  }
  if (active === session) throw new Error('Personal data changed during sync');
}

function sync(session: SyncSession): Promise<void> {
  if (active !== session) return Promise.resolve();
  if (session.job) return session.job;

  session.job = exchange(session)
    .then(() => {
      if (active !== session) return;
      session.retryDelay = INITIAL_RETRY;
      session.synced = !hasPendingData(local.accounts[session.userId]);
      notify();
      scheduleSync(session.synced ? REFRESH_INTERVAL : EDIT_DELAY);
    })
    .catch((error: unknown) => {
      if (active !== session) return;
      if (error instanceof AuthError && error.code === 'wrong_credentials') {
        session.onUnauthorized();
        return;
      }
      scheduleSync(session.retryDelay);
      session.retryDelay = Math.min(session.retryDelay * 2, MAX_RETRY);
    })
    .finally(() => { session.job = undefined; });
  return session.job;
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') scheduleSync(0);
  else stopTimer();
});

export function usePersonalData<K extends keyof PersonalData>(key: K): PersonalData[K] {
  return useSyncExternalStore(subscribe, () => getData()[key]);
}

export function usePersonalDataSynced(): boolean {
  return useSyncExternalStore(subscribe, () => active?.synced ?? false);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export const personalData = {
  get: getData,
  ownerId: () => active?.userId ?? null,
  set<K extends keyof PersonalData>(key: K, value: PersonalData[K]): Promise<void> {
    const previous = getData();
    const next = { ...previous, [key]: value };
    if (active) {
      local.accounts[active.userId].data = next;
      active.synced = false;
    } else {
      local.guest = next;
    }
    removeUnusedPhotos(previous.scans, next.scans);
    const write = persist();
    notify();
    scheduleSync(EDIT_DELAY);
    return write;
  },
  setAccount(userId: number, token: string, onUnauthorized: () => void): Promise<void> {
    const empty = EMPTY_PERSONAL_DATA;
    const account = local.accounts[userId] ?? { revision: 0, synced: empty, data: empty };
    if (!sameData(local.guest, empty)) {
      const merged = mergePersonalData(empty, local.guest, account.data);
      removeUnusedPhotos([...local.guest.scans, ...account.data.scans], merged.scans);
      account.data = merged;
      local.guest = empty;
    }
    local.accounts[userId] = account;
    active = { userId, token, onUnauthorized, synced: false, retryDelay: INITIAL_RETRY };
    const write = persist();
    notify();
    scheduleSync(0);
    return write;
  },
  clearAccount() {
    active = null;
    stopTimer();
    notify();
  },
  async flush() {
    const session = active;
    if (session) {
      const account = local.accounts[session.userId];
      if (hasPendingData(account)) await sync(session);
    }
    await pendingWrite;
  },
  async discardAccount(userId: number) {
    deleteScanPhotos(local.accounts[userId]?.data.scans ?? []);
    delete local.accounts[userId];
    await persist();
  },
};
