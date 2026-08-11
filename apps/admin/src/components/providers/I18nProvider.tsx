"use client";

import { useEffect } from "react";

import { I18nextProvider } from "react-i18next";

import i18n from "@/lib/i18n/config";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

// Keeps the i18next language in sync with the user's stored language preference.
// The preference is hydrated from localStorage after mount, so we switch here
// (post-hydration) to avoid an SSR/client text mismatch.
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = usePreferencesStore((s) => s.language);

  useEffect(() => {
    if (language && i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
