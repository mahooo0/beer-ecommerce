export const THEME_MODE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((o) => o.value);
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = [
  {
    label: "Default",
    value: "default",
    primary: {
      light: "oklch(0.205 0 0)",
      dark: "oklch(0.922 0 0)",
    },
    gradient: {
      light: "",
      dark: "",
    },
  },
  {
    label: "Aurora",
    value: "aurora",
    primary: {
      light: "oklch(0.62 0.17 250)",
      dark: "oklch(0.68 0.15 250)",
    },
    gradient: {
      light: "linear-gradient(135deg, #2dd4bf 0%, #3b82f6 55%, #6366f1 100%)",
      dark: "linear-gradient(135deg, #34e0ca 0%, #4b90ff 55%, #7b7bff 100%)",
    },
  },
  {
    label: "Blue",
    value: "blue",
    primary: {
      light: "oklch(0.72 0.11 245)",
      dark: "oklch(0.78 0.1 245)",
    },
    gradient: {
      light: "",
      dark: "",
    },
  },
  {
    label: "Cosmic",
    value: "cosmic",
    primary: {
      light: "oklch(0.58 0.24 310)",
      dark: "oklch(0.66 0.22 310)",
    },
    gradient: {
      light: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 55%, #ec4899 100%)",
      dark: "linear-gradient(135deg, #9d74f8 0%, #e05cf5 55%, #f45ba6 100%)",
    },
  },
  {
    label: "Sunset",
    value: "sunset",
    primary: {
      light: "oklch(0.68 0.2 15)",
      dark: "oklch(0.72 0.19 15)",
    },
    gradient: {
      light: "linear-gradient(135deg, #ff9a3c 0%, #ff5c72 50%, #f43f8f 100%)",
      dark: "linear-gradient(135deg, #ffa24a 0%, #ff6379 50%, #f74d97 100%)",
    },
  },
  {
    label: "Violet",
    value: "violet",
    primary: {
      light: "oklch(0.74 0.12 300)",
      dark: "oklch(0.79 0.11 300)",
    },
    gradient: {
      light: "",
      dark: "",
    },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---
