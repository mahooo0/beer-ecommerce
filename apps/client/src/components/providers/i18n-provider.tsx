"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@/lib/i18n/i18n";
import { fallbackLng } from "@/lib/i18n/settings";

export function I18nProvider({
  lang = fallbackLng,
  children,
}: {
  lang?: string;
  children: React.ReactNode;
}) {
  // Initialise on the server-detected language so the first client render
  // matches the server HTML (no hydration mismatch, no flash of the fallback).
  const [i18n] = useState(() => createI18n(lang));

  useEffect(() => {
    if (lang && lang !== i18n.language) {
      void i18n.changeLanguage(lang);
    }
    document.documentElement.lang = i18n.language;
  }, [i18n, lang]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
