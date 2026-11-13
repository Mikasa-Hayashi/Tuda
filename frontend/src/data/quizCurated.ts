/**
 * Quizzes are written in ru / en / ar / zh and live on the server (backend/static/quizzes/<city>.json);
 * the bundled core ones plus the downloaded city packs are read through the quiz store.
 * A language without its own text falls back to English.
 */
import { getQuiz, type CuratedQuestion } from '../offline/quizStore';

export type { CuratedQuestion, CuratedQuiz } from '../offline/quizStore';

/** Questions in the user's language (falls back to English), or null when there is no quiz. */
export function curatedQuestions(monumentId: string, lang: string): CuratedQuestion[] | null {
  const quiz = getQuiz(monumentId);
  if (!quiz) return null;
  const code = lang.slice(0, 2) as 'ru' | 'en' | 'ar' | 'zh';
  return quiz[code] ?? quiz.en;
}
