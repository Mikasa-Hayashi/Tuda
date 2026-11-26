import { personalData, usePersonalData } from './personalData';
import type { QuizResult } from './personalDataTypes';

export type { QuizResult } from './personalDataTypes';

/** A quiz counts as passed with at least 80 % of the answers right (4/5). */
export const PASS_RATIO = 0.8;

export const quizProgress = {
  /** Saves the result of a finished attempt; returns whether this attempt passed the quiz. */
  record(monumentId: string, score: number, total: number): boolean {
    const store = personalData.get().quizzes;
    const prev = Object.prototype.hasOwnProperty.call(store, monumentId) ? store[monumentId] : undefined;
    const passedNow = total > 0 && score / total >= PASS_RATIO;
    void personalData.set('quizzes', {
      ...store,
      [monumentId]: {
        score,
        total,
        passed: passedNow || !!prev?.passed,
        attempts: (prev?.attempts ?? 0) + 1,
      },
    });
    return passedNow;
  },
  clear() {
    void personalData.set('quizzes', {});
  },
};

export function useQuizProgress(): Record<string, QuizResult> {
  return usePersonalData('quizzes');
}
