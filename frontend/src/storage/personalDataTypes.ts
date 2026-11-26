export type SavedRoute = {
  id: string;
  name: string;
  monumentIds: string[];
  summary: string;
  time: 'couple' | 'half' | 'full';
  age: 'kids' | 'adults' | 'family';
  createdAt: number;
};

export type ScanRecord = {
  id: string;
  monumentId: string;
  monumentName?: string | null;
  confidence: number;
  recognized: boolean;
  at: number;
};

export type AchievementProgress = {
  visited: string[];
  scans: number;
  routes: string[];
  quizzes: string[];
  audio: string[];
};

export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  attempts: number;
};

export type PersonalData = {
  monumentFavorites: string[];
  routeFavorites: string[];
  savedRoutes: SavedRoute[];
  customRoute: string[];
  achievements: AchievementProgress;
  quizzes: Record<string, QuizResult>;
  scans: ScanRecord[];
};

export type PersonalDataWrite = { id: string; deviceId: string; data: PersonalData };

export const MAX_SCAN_ENTRIES = 50;

export const EMPTY_PERSONAL_DATA: PersonalData = {
  monumentFavorites: [],
  routeFavorites: [],
  savedRoutes: [],
  customRoute: [],
  achievements: { visited: [], scans: 0, routes: [], quizzes: [], audio: [] },
  quizzes: {},
  scans: [],
};

export function personalEntryId(at: number): string {
  return `${at}-${Math.random().toString(36).slice(2)}`;
}
