import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./ar.json";
import en from "./en.json";
import { LANGUAGES, type LanguageId } from "./languages";
import ru from "./ru.json";
import zh from "./zh.json";

const LANGUAGE_KEY = "settings.language";
const FALLBACK_LANGUAGE: LanguageId = "ru";
const i18n = createInstance();

function isLanguageId(value: string | null | undefined): value is LanguageId {
  return LANGUAGES.some(({ id }) => id === value);
}

export const i18nReady = AsyncStorage.getItem(LANGUAGE_KEY)
  .catch(() => null)
  .then((savedLanguage) => {
    const deviceLanguage = Localization.getLocales()[0]?.languageCode;
    const defaultLanguage = isLanguageId(deviceLanguage) ? deviceLanguage : FALLBACK_LANGUAGE;

    return i18n.use(initReactI18next).init({
      lng: isLanguageId(savedLanguage) ? savedLanguage : defaultLanguage,
      fallbackLng: FALLBACK_LANGUAGE,

      resources: {
        en: { translation: en },
        ru: { translation: ru },
        ar: { translation: ar },
        zh: { translation: zh },
      },

      interpolation: {
        escapeValue: false,
      },
    });
  });

export function setAppLanguage(language: string): void {
  if (!isLanguageId(language)) return;

  void i18n.changeLanguage(language);
  void AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => {});
}

export default i18n;
