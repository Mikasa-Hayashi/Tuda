import { personalData, usePersonalData } from './personalData';
import type { AchievementProgress as Progress } from './personalDataTypes';

/**
 * Each screen reports what the user did, and the badge list uses that progress.
 */
function recordId(key: 'visited' | 'routes' | 'quizzes' | 'audio', id: string) {
  const progress = personalData.get().achievements;
  if (!progress[key].includes(id)) {
    void personalData.set('achievements', { ...progress, [key]: [...progress[key], id] });
  }
}

export const achievements = {
  recordVisit: (monumentId: string) => recordId('visited', monumentId),
  recordScan: () => {
    const progress = personalData.get().achievements;
    void personalData.set('achievements', { ...progress, scans: progress.scans + 1 });
  },
  recordRouteStarted: (routeId: string) => recordId('routes', routeId),
  recordQuiz: (quizId: string) => recordId('quizzes', quizId),
  recordAudio: (monumentId: string) => recordId('audio', monumentId),
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

/** Badges with the user's current progress; `favorites` is the live favorites count. */
export function useBadges(favorites: number): BadgeState[] {
  const p = usePersonalData('achievements');
  return BADGES.map((b) => {
    const current = Math.min(b.value(p, favorites), b.target);
    return { ...b, current, earned: current >= b.target };
  });
}
