export const languages = ["pl", "uk"] as const;

export type Language = (typeof languages)[number];

export const fallbackLng: Language = "pl";
export const defaultNS = "common";
export const cookieName = "taranka-lang";

export const namespaces = [
  "common",
  "home",
  "catalog",
  "cart",
  "checkout",
  "profile",
  "auth",
  "categories",
  "shop",
  "misc",
] as const;

export type Namespace = (typeof namespaces)[number];

export const languageLabels: Record<Language, { native: string; short: string }> = {
  pl: { native: "Polski", short: "PL" },
  uk: { native: "Українська", short: "UA" },
};

export function isLanguage(value: string | undefined | null): value is Language {
  return !!value && (languages as readonly string[]).includes(value);
}
