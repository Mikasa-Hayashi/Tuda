/**
 * Helpers for writing quizzes compactly. A question is written once for all languages:
 * [ru, en, ar, zh], each being [question, right answer, ...wrong answers].
 * The right answer's position is shuffled deterministically per language.
 */
import type { CuratedQuestion, CuratedQuiz } from './quizCurated';

export type Row = string[];
export type Q4 = [Row, Row, Row, Row];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function mk(row: Row): CuratedQuestion {
  const [question, right, ...wrong] = row;
  const pos = hash(question) % (wrong.length + 1);
  const options = [...wrong];
  options.splice(pos, 0, right);
  return { question, options, correct: pos };
}

export function quiz4(rows: Q4[]): CuratedQuiz {
  return {
    ru: rows.map((r) => mk(r[0])),
    en: rows.map((r) => mk(r[1])),
    ar: rows.map((r) => mk(r[2])),
    zh: rows.map((r) => mk(r[3])),
  };
}
