/**
 * Hand-written quizzes, keyed by monument id. Facts come from backend/data (monument details).
 * Languages without their own text (ar, zh) fall back to English.
 * `correct` is the index of the right option *before* the options are shuffled by the screen.
 */

export type CuratedQuestion = { question: string; options: string[]; correct: number };

type CuratedQuiz = { ru: CuratedQuestion[]; en: CuratedQuestion[] };

export const CURATED_QUIZZES: Record<string, CuratedQuiz> = {
  // «Родина-мать зовёт!» — Mamayev Kurgan, Volgograd
  volgograd_02: {
    ru: [
      {
        question: 'В каком году открыли скульптуру «Родина-мать зовёт!»?',
        options: ['1959', '1963', '1967', '1972'],
        correct: 2,
      },
      {
        question: 'Какова общая высота монумента вместе с мечом?',
        options: ['65 м', '75 м', '85 м', '95 м'],
        correct: 2,
      },
      {
        question: 'Сколько метров составляет высота самой фигуры?',
        options: ['42 м', '52 м', '62 м', '72 м'],
        correct: 1,
      },
      {
        question: 'Какова длина меча в руке скульптуры?',
        options: ['17 м', '22 м', '27 м', '33 м'],
        correct: 2,
      },
      {
        question: 'Кто автор скульптуры?',
        options: ['Вера Мухина', 'Евгений Вучетич', 'Николай Томский', 'Сергей Коненков'],
        correct: 1,
      },
    ],
    en: [
      {
        question: 'In which year was The Motherland Calls statue unveiled?',
        options: ['1959', '1963', '1967', '1972'],
        correct: 2,
      },
      {
        question: 'What is the total height of the monument, sword included?',
        options: ['65 m', '75 m', '85 m', '95 m'],
        correct: 2,
      },
      {
        question: 'How tall is the figure itself?',
        options: ['42 m', '52 m', '62 m', '72 m'],
        correct: 1,
      },
      {
        question: 'How long is the sword in the statue’s hand?',
        options: ['17 m', '22 m', '27 m', '33 m'],
        correct: 2,
      },
      {
        question: 'Who was the sculptor?',
        options: ['Vera Mukhina', 'Yevgeny Vuchetich', 'Nikolay Tomsky', 'Sergey Konenkov'],
        correct: 1,
      },
    ],
  },
};
