export type LanguageId = 'en' | 'ru' | 'ar' | 'zh';

// Language names are shown in their own language, as in iOS.
export const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' },
  { id: 'ar', label: 'العربية' },
  { id: 'zh', label: '中文' },
];
