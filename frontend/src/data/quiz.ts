import type { TFunction } from 'i18next';

import { monumentFilterMeta } from './monumentFilterMeta';
import { getMonumentById } from '../db/monumentRepository';

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type QuizParams = {
  monumentId: string;
  lang: string;
  t: TFunction;
};

type QuizFactRow = {
  labelKey: string;
  value: string;
};

const PREFERRED_LABEL_KEYS = [
  'monument_fields.year',
  'monument_fields.height',
  'monument_fields.architect',
  'monument_fields.sculptor',
  'monument_fields.material',
  'monument_fields.opening_date',
  'monument_fields.strategic_height',
  'monument_fields.obelisk_height',
  'monument_fields.locomotive_model',
  'monument_fields.manufacturer',
  'monument_fields.tram_model',
  'monument_fields.operation_period',
  'monument_fields.base_wagon',
  'monument_fields.total_area',
  'monument_fields.stage_area',
  'monument_fields.capacity',
  'monument_fields.number_of_columns',
  'monument_fields.column_material',
  'monument_fields.exhibition_count',
  'monument_fields.ticket_prices',
  'monument_fields.guided_tours',
  'monument_fields.schedule',
];

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function orderOptions(options: string[], seed: string): string[] {
  return [...options].sort((a, b) => {
    const aHash = hashString(`${seed}:${a}`);
    const bHash = hashString(`${seed}:${b}`);
    return aHash - bHash || a.localeCompare(b);
  });
}

function buildOptions(correctValue: string, distractorPool: string[], seed: string): string[] {
  const unique = uniqueStrings([correctValue, ...distractorPool]);
  const distractors = unique.filter((value) => value !== correctValue).slice(0, 3);
  return orderOptions([correctValue, ...distractors], seed);
}

function getAllLocalizedFacts(lang: string): Record<string, QuizFactRow[]> {
  const result: Record<string, QuizFactRow[]> = {};

  for (const monumentId of Object.keys(monumentFilterMeta)) {
    const monument = getMonumentById(monumentId, lang);
    if (!monument) continue;

    const rows = [...monument.details, ...monument.visitors]
      .filter((row): row is QuizFactRow => Boolean(row.value))
      .map((row) => ({ labelKey: row.labelKey, value: row.value as string }));

    result[monumentId] = rows;
  }

  return result;
}

export function getQuizQuestions({ monumentId, lang, t }: QuizParams): QuizQuestion[] {
  const monument = getMonumentById(monumentId, lang);
  if (!monument) return [];

  const factsByMonument = getAllLocalizedFacts(lang);
  const currentFacts = factsByMonument[monumentId] ?? [];

  const prioritizedFacts = PREFERRED_LABEL_KEYS.map((labelKey) =>
    currentFacts.find((row) => row.labelKey === labelKey),
  ).filter((row): row is QuizFactRow => Boolean(row));

  const questions: QuizQuestion[] = [];

  for (const fact of prioritizedFacts) {
    const sameFieldValues = Object.entries(factsByMonument)
      .filter(([id]) => id !== monumentId)
      .flatMap(([, rows]) => rows.filter((row) => row.labelKey === fact.labelKey).map((row) => row.value));

    const anyOtherValues = Object.entries(factsByMonument)
      .filter(([id]) => id !== monumentId)
      .flatMap(([, rows]) => rows.map((row) => row.value));

    const options = buildOptions(
      fact.value,
      uniqueStrings([...sameFieldValues, ...anyOtherValues]),
      `${monumentId}:${fact.labelKey}`,
    );

    if (options.length < 2) continue;

    questions.push({
      question: t('quiz.factQuestion', {
        name: monument.name,
        label: t(fact.labelKey),
      }),
      options,
      correctIndex: options.indexOf(fact.value),
    });

    if (questions.length === 5) break;
  }

  return questions;
}
