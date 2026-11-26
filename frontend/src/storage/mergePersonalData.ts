import { MAX_SCAN_ENTRIES, type PersonalData, type QuizResult } from './personalDataTypes';

function mergeItems<T>(base: T[], local: T[], remote: T[], key: (item: T) => string): T[] {
  const previous = new Set(base.map(key));
  const current = new Set(local.map(key));
  const merged = new Map(remote.map((item) => [key(item), item]));
  previous.forEach((id) => {
    if (!current.has(id)) merged.delete(id);
  });
  local.forEach((item) => {
    const id = key(item);
    if (!previous.has(id) && !merged.has(id)) merged.set(id, item);
  });
  return [...merged.values()];
}

const mergeIds = (base: string[], local: string[], remote: string[]) =>
  mergeItems(base, local, remote, (id) => id);

function mergeRouteStops(base: string[], local: string[], remote: string[]): string[] {
  if (base.length === local.length && base.every((id, index) => id === local[index])) return remote;

  const remaining = new Set(mergeIds(base, local, remote));
  const localOrder = local.filter((id) => remaining.delete(id));
  return [...localOrder, ...remaining];
}

function sameQuiz(a: QuizResult, b: QuizResult | undefined): boolean {
  return !!b && a.score === b.score && a.total === b.total &&
    a.passed === b.passed && a.attempts === b.attempts;
}

function mergeQuizzes(
  base: PersonalData['quizzes'],
  local: PersonalData['quizzes'],
  remote: PersonalData['quizzes'],
): PersonalData['quizzes'] {
  const merged = new Map(Object.entries(remote));
  Object.keys(base).forEach((id) => {
    if (!Object.hasOwn(local, id)) merged.delete(id);
  });
  Object.entries(local).forEach(([id, quiz]) => {
    const previous = Object.hasOwn(base, id) ? base[id] : undefined;
    if (sameQuiz(quiz, previous)) return;
    const saved = merged.get(id);
    merged.set(id, {
      ...quiz,
      passed: quiz.passed || !!saved?.passed,
      attempts: Math.max(quiz.attempts, saved?.attempts ?? 0),
    });
  });
  return Object.fromEntries(merged);
}

/** Apply edits since the last known revision to a fresh server snapshot. */
export function mergePersonalData(base: PersonalData, local: PersonalData, remote: PersonalData): PersonalData {
  const before = base.achievements;
  const edited = local.achievements;
  const saved = remote.achievements;

  return {
    monumentFavorites: mergeIds(base.monumentFavorites, local.monumentFavorites, remote.monumentFavorites),
    routeFavorites: mergeIds(base.routeFavorites, local.routeFavorites, remote.routeFavorites),
    savedRoutes: mergeItems(base.savedRoutes, local.savedRoutes, remote.savedRoutes, (r) => r.id)
      .sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id)),
    customRoute: mergeRouteStops(base.customRoute, local.customRoute, remote.customRoute),
    achievements: {
      visited: mergeIds(before.visited, edited.visited, saved.visited),
      scans: Math.max(edited.scans, saved.scans),
      routes: mergeIds(before.routes, edited.routes, saved.routes),
      quizzes: mergeIds(before.quizzes, edited.quizzes, saved.quizzes),
      audio: mergeIds(before.audio, edited.audio, saved.audio),
    },
    quizzes: mergeQuizzes(base.quizzes, local.quizzes, remote.quizzes),
    scans: mergeItems(base.scans, local.scans, remote.scans, (scan) => scan.id)
      .sort((a, b) => b.at - a.at || a.id.localeCompare(b.id))
      .slice(0, MAX_SCAN_ENTRIES),
  };
}
