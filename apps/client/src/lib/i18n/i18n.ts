import { createInstance, type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultNS, fallbackLng, languages, namespaces } from "./settings";
import { resources } from "./resources";

export { resources };

/**
 * Creates and initialises an i18next instance for the given language.
 * The same factory is used on the server (per request) and on the client,
 * so both render the same language and there is no hydration mismatch.
 */
export function createI18n(lng: string = fallbackLng): I18nInstance {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng,
    supportedLngs: [...languages],
    defaultNS,
    ns: [...namespaces],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
