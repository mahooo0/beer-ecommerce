import { cookieName, fallbackLng, isLanguage, type Language } from "./settings";

/** Reads the persisted language from cookie (preferred) then localStorage. */
export function readStoredLanguage(): Language {
  if (typeof document === "undefined") return fallbackLng;

  const fromCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieName}=`))
    ?.split("=")[1];
  if (isLanguage(fromCookie)) return fromCookie;

  try {
    const fromStorage = window.localStorage.getItem(cookieName);
    if (isLanguage(fromStorage)) return fromStorage;
  } catch {
    /* localStorage may be unavailable (private mode) */
  }

  return fallbackLng;
}

/** Persists the chosen language to cookie + localStorage and updates <html lang>. */
export function persistLanguage(lng: Language): void {
  if (typeof document === "undefined") return;

  // 1 year, site-wide.
  document.cookie = `${cookieName}=${lng}; path=/; max-age=31536000; samesite=lax`;
  try {
    window.localStorage.setItem(cookieName, lng);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lng;
}
