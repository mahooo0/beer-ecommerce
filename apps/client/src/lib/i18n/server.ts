import "server-only";
import { cookies } from "next/headers";
import { createInstance, type TFunction } from "i18next";
import { resources } from "./resources";
import {
  cookieName,
  defaultNS,
  fallbackLng,
  isLanguage,
  languages,
  namespaces,
  type Language,
  type Namespace,
} from "./settings";

// NOTE: this module must NOT import `react-i18next` (directly or via ./i18n).
// react-i18next calls React.createContext at module scope, which throws when
// evaluated in a React Server Component. The server only needs a plain i18next
// instance for `getFixedT`, so we build one here without the React bindings.

/** Reads the persisted language from the request cookie (server components). */
export async function getServerLang(): Promise<Language> {
  const store = await cookies();
  const value = store.get(cookieName)?.value;
  return isLanguage(value) ? value : fallbackLng;
}

/**
 * Returns a translation function for use in server components / route files.
 * Usage: `const t = await getServerT("catalog"); t("someKey")`
 */
export async function getServerT(
  ns: Namespace = defaultNS,
): Promise<TFunction> {
  const lng = await getServerLang();
  const instance = createInstance();
  await instance.init({
    resources,
    lng,
    fallbackLng,
    supportedLngs: [...languages],
    defaultNS,
    ns: [...namespaces],
    interpolation: { escapeValue: false },
  });
  return instance.getFixedT(lng, ns);
}
