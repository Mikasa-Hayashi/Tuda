import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./ar.json";
import en from "./en.json";
import ru from "./ru.json";
import zh from "./zh.json";

const deviceLanguage = Localization.getLocales()[0]?.languageCode || "ru";

i18n
  .use(initReactI18next)
  .init({
    lng: deviceLanguage,
    fallbackLng: "ru",

    resources: {
      en: { translation: en },
      ru: { translation: ru },
      ar: { translation: ar },
      zh: { translation: zh }
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;