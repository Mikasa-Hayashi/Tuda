/**
 * Hand-written quizzes, keyed by monument id. Facts come from backend/data (monument details)
 * and Wikipedia. Quizzes are written in ru / en / ar / zh (see quizHelpers); a language
 * without its own text falls back to English.
 */
import { MORE_QUIZZES } from './quizMore';
import { SIRIUS_QUIZZES } from './quizSirius';

export type CuratedQuestion = { question: string; options: string[]; correct: number };

export type CuratedQuiz = {
  ru: CuratedQuestion[];
  en: CuratedQuestion[];
  ar?: CuratedQuestion[];
  zh?: CuratedQuestion[];
};

export const CURATED_QUIZZES: Record<string, CuratedQuiz> = {
  ...MORE_QUIZZES,
  ...SIRIUS_QUIZZES,
};

/** Monument ids that have a quiz. */
export const QUIZ_MONUMENT_IDS = Object.keys(CURATED_QUIZZES);

/** Questions in the user's language (falls back to English). */
export function curatedQuestions(monumentId: string, lang: string): CuratedQuestion[] | null {
  const quiz = CURATED_QUIZZES[monumentId];
  if (!quiz) return null;
  const code = lang.slice(0, 2) as 'ru' | 'en' | 'ar' | 'zh';
  return quiz[code] ?? quiz.en;
}
