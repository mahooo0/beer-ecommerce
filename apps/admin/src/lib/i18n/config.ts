import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";

import { en } from "./locales/en";
import { pl } from "./locales/pl";
import { uk } from "./locales/uk";

// Single shared i18next instance for the admin app.
// It is initialized with the default language so the server render and the
// first client render match (no hydration mismatch). The I18nProvider then
// switches to the user's stored language (localStorage) right after mount.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      pl: { translation: pl },
      uk: { translation: uk },
    },
    lng: PREFERENCE_DEFAULTS.language,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
