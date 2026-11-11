import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Progress towards badges, kept on the device. Each screen reports what the user did
 * (`record…`); the badge list below turns the counters into earned / locked badges.
 */
type Progress = {
  visited: string[];
  scans: number;
  routes: string[];
  quizzes: string[];
  audio: string[];
};

const KEY = 'achievements.v1';
const EMPTY: Progress = { visited: [], scans: 0, routes: [], quizzes: [], audio: [] };

let progress: Progress = EMPTY;
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      progress = { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) };
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

function update(next: Progress) {
  progress = next;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

const addUnique = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const achievements = {
  recordVisit: (monumentId: string) => {
    const visited = addUnique(progress.visited, monumentId);
    if (visited !== progress.visited) update({ ...progress, visited });
  },
  recordScan: () => update({ ...progress, scans: progress.scans + 1 }),
  recordRouteStarted: (routeId: string) => {
    const routes = addUnique(progress.routes, routeId);
    if (routes !== progress.routes) update({ ...progress, routes });
  },
  recordQuiz: (quizId: string) => {
    const quizzes = addUnique(progress.quizzes, quizId);
    if (quizzes !== progress.quizzes) update({ ...progress, quizzes });
  },
  recordAudio: (monumentId: string) => {
    const audio = addUnique(progress.audio, monumentId);
    if (audio !== progress.audio) update({ ...progress, audio });
  },
};

export type BadgeDef = {
  id: string;
  /** SF Symbol. */
  icon: string;
  color: string;
  title: string;
  description: string;
  target: number;
  value: (p: Progress, favorites: number) => number;
};

export const BADGES: BadgeDef[] = [
  {
    id: 'first_steps',
    icon: 'figure.walk',
    color: '#34C759',
    title: 'badges.first_steps',
    description: 'badges.first_steps_desc',
    target: 1,
    value: (p) => p.visited.length,
  },
  {
    id: 'explorer',
    icon: 'binoculars.fill',
    color: '#FF9500',
    title: 'badges.explorer',
    description: 'badges.explorer_desc',
    target: 5,
    value: (p) => p.visited.length,
  },
  {
    id: 'expert',
    icon: 'rosette',
    color: '#AF52DE',
    title: 'badges.expert',
    description: 'badges.expert_desc',
    target: 10,
    value: (p) => p.visited.length,
  },
  {
    id: 'scanner',
    icon: 'camera.viewfinder',
    color: '#0A84FF',
    title: 'badges.scanner',
    description: 'badges.scanner_desc',
    target: 1,
    value: (p) => p.scans,
  },
  {
    id: 'walker',
    icon: 'signpost.right.and.left.fill',
    color: '#30B0C7',
    title: 'badges.walker',
    description: 'badges.walker_desc',
    target: 1,
    value: (p) => p.routes.length,
  },
  {
    id: 'listener',
    icon: 'headphones',
    color: '#FF2D55',
    title: 'badges.listener',
    description: 'badges.listener_desc',
    target: 1,
    value: (p) => p.audio.length,
  },
  {
    id: 'quiz',
    icon: 'questionmark.bubble.fill',
    color: '#5856D6',
    title: 'badges.quiz',
    description: 'badges.quiz_desc',
    target: 1,
    value: (p) => p.quizzes.length,
  },
  {
    id: 'fan',
    icon: 'heart.fill',
    color: '#FF3B30',
    title: 'badges.fan',
    description: 'badges.fan_desc',
    target: 3,
    value: (_p, favorites) => favorites,
  },
];

export type BadgeState = BadgeDef & { current: number; earned: boolean };

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Badges with the user's current progress; `favorites` is the live favorites count. */
export function useBadges(favorites: number): BadgeState[] {
  const p = useSyncExternalStore(subscribe, () => progress);
  return BADGES.map((b) => {
    const current = Math.min(b.value(p, favorites), b.target);
    return { ...b, current, earned: current >= b.target };
  });
}
