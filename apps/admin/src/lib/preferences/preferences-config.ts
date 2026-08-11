/**
 * How each preference should be saved.
 *
 * "client-cookie"  → write cookie on the browser only.
 * "server-cookie"  → write cookie through a Server Action.
 * "localStorage"   → save only on the client, persists across visits.
 * "none"           → no saving, resets on reload.
 *
 * Everything the user changes in the customizer is now persisted to
 * localStorage so the exact same settings come back on the next visit.
 * The pre-hydration boot script (scripts/theme-boot.tsx) reads localStorage
 * and applies all data-* attributes before first paint, so CSS-driven prefs
 * do not flicker. sidebar_variant / sidebar_collapsible are also stored in
 * localStorage; because they feed an SSR prop they reconcile on the client
 * right after hydration (negligible, only on a hard reload).
 */

import type { FontKey } from "@/lib/fonts/registry";

import type {
  ContentLayout,
  Density,
  Direction,
  Language,
  LayoutMode,
  NavbarStyle,
  SidebarCollapsible,
  SidebarVariant,
} from "./layout";
import type { ThemeMode, ThemePreset } from "./theme";

export type PreferencePersistence = "none" | "client-cookie" | "server-cookie" | "localStorage";

/**
 * All available preference keys and their value types.
 */
export type PreferenceValueMap = {
  theme_mode: ThemeMode;
  theme_preset: ThemePreset;
  font: FontKey;
  content_layout: ContentLayout;
  navbar_style: NavbarStyle;
  sidebar_variant: SidebarVariant;
  sidebar_collapsible: SidebarCollapsible;
  density: Density;
  layout_mode: LayoutMode;
  direction: Direction;
  language: Language;
};

export type PreferenceKey = keyof PreferenceValueMap;

/**
 * Layout-critical keys → these still feed an SSR prop (sidebar shape) in the
 * dashboard layout. They are allowed to use localStorage now; the client
 * reconciles the value right after hydration (see boot script + app-sidebar).
 */
export const LAYOUT_CRITICAL_KEYS = ["sidebar_variant", "sidebar_collapsible"] as const;
export type LayoutCriticalKey = (typeof LAYOUT_CRITICAL_KEYS)[number];

/**
 * Every key can use any persistence mode.
 */
type PreferencePersistenceConfig = {
  [K in PreferenceKey]: PreferencePersistence;
};

/**
 * Default preference values on first load.
 */
export const PREFERENCE_DEFAULTS: PreferenceValueMap = {
  theme_mode: "light",
  theme_preset: "default",
  font: "geist",
  content_layout: "centered",
  navbar_style: "sticky",
  sidebar_variant: "inset",
  sidebar_collapsible: "icon",
  density: "comfortable",
  layout_mode: "sidebar",
  direction: "ltr",
  language: "en",
};

/**
 * How each preference is persisted.
 * Everything the user picks in the customizer is saved to localStorage so it
 * survives across visits.
 */
export const PREFERENCE_PERSISTENCE: PreferencePersistenceConfig = {
  theme_mode: "localStorage",
  theme_preset: "localStorage",
  font: "localStorage",
  content_layout: "localStorage",
  navbar_style: "localStorage",
  sidebar_variant: "localStorage",
  sidebar_collapsible: "localStorage",
  density: "localStorage",
  layout_mode: "localStorage",
  direction: "localStorage",
  language: "localStorage",
};
