/**
 * Explicit, vibrant, dark-friendly colour system for the analytics screens.
 *
 * We deliberately DON'T rely on the theme's `--chart-*` vars here: the active
 * theme preset renders them near-greyscale, which is what made the charts look
 * dull. These hex values are picked to stay legible on both light and dark card
 * backgrounds.
 */

export const CHART = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  indigo: '#6366f1',
  teal: '#14b8a6',
} as const;

/** Ordered categorical palette for multi-series charts. */
export const CHART_SERIES = [
  CHART.blue,
  CHART.emerald,
  CHART.amber,
  CHART.violet,
  CHART.rose,
  CHART.cyan,
  CHART.indigo,
  CHART.teal,
];

/** One distinct colour per order status (used across every order chart). */
export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#10b981',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  returned: '#f97316',
  refund_requested: '#ec4899',
};

export type CardTone = 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'indigo';

/**
 * Per-tone class strings for tinted-gradient stat cards. Full literal strings so
 * Tailwind's JIT keeps them; each card gets a different dim hue on its backdrop.
 */
export const CARD_TONES: Record<CardTone, { grad: string; iconBg: string; iconText: string; accent: string }> = {
  blue: {
    grad: 'from-blue-500/12',
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    grad: 'from-emerald-500/12',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    grad: 'from-amber-500/12',
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    grad: 'from-violet-500/12',
    iconBg: 'bg-violet-500/15',
    iconText: 'text-violet-600 dark:text-violet-400',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  rose: {
    grad: 'from-rose-500/12',
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-600 dark:text-rose-400',
    accent: 'text-rose-600 dark:text-rose-400',
  },
  cyan: {
    grad: 'from-cyan-500/12',
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-600 dark:text-cyan-400',
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  indigo: {
    grad: 'from-indigo-500/12',
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
};

/**
 * Solid, vibrant fill class per tone — for progress/mini bars. Full literal
 * strings so Tailwind's JIT keeps them. Brighter than the tinted card grads on
 * purpose: a bar needs to read as a saturated block against the muted track.
 */
export const TONE_BAR: Record<CardTone, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  indigo: 'bg-indigo-500',
};
