// Centralized chart / visualization color palette.
// All values reference CSS custom properties defined in globals.css.
// Use these constants everywhere instead of hardcoded HSL strings.

/** Total number of color schemes available (24 chromatic + 6 black card variants). */
export const COLOR_SCHEME_COUNT = 30;

/** Helper — wraps a CSS custom property name for inline style usage. */
const v = (token: string) => `hsl(var(--${token}))`;

/**
 * Returns a CSS color string with alpha from a CSS custom property.
 * Usage: `withAlpha("chart-1", 0.12)` → `hsl(var(--chart-1) / 0.12)`
 */
export const withAlpha = (token: string, alpha: number) =>
  `hsl(var(--${token}) / ${alpha})`;

// ── 24 sequential chart colors ──

export const chart = {
  primary: v("chart-1"), // Brand magenta (= --primary)
  sky: v("chart-2"),
  teal: v("chart-3"),
  jade: v("chart-4"),
  green: v("chart-5"),
  lime: v("chart-6"),
  amber: v("chart-7"),
  orange: v("chart-8"),
  vermilion: v("chart-9"),
  red: v("chart-10"),
  rose: v("chart-11"),
  magenta: v("chart-12"),
  orchid: v("chart-13"),
  purple: v("chart-14"),
  indigo: v("chart-15"),
  cobalt: v("chart-16"),
  steel: v("chart-17"),
  cadet: v("chart-18"),
  seafoam: v("chart-19"),
  olive: v("chart-20"),
  gold: v("chart-21"),
  tangerine: v("chart-22"),
  crimson: v("chart-23"),
  gray: v("chart-24"),
} as const;

/** Ordered array — use for pie / donut / bar where you need N colors by index. */
export const CHART_COLORS = Object.values(chart);

/** CSS variable names (without --) matching CHART_COLORS order — for withAlpha(). */
export const CHART_TOKENS = Array.from(
  { length: 24 },
  (_, i) => `chart-${i + 1}`,
) as readonly string[];

// ── Semantic aliases ──

export const chartAxis = v("chart-axis");

/** Positive / income / inflow */
export const chartPositive = chart.green;

/** Negative / expense / outflow — reuses the destructive token */
export const chartNegative = v("destructive");

/** Primary chart accent (most-used single color) */
export const chartPrimary = chart.primary;

// ── Card color schemes (30 schemes for SourceCard backgrounds) ──
// 1-24: chromatic colors (white text)
// 25-30: black card variants (each with a unique accent text color)

/** Semantic labels for all 30 color schemes */
export const CHART_COLOR_LABELS = [
  // 1-24: chromatic
  "品红", "天蓝", "青色", "翡翠", "绿色", "青柠",
  "琥珀", "橙色", "朱红", "红色", "玫红", "蓝色",
  "兰花", "紫色", "靛蓝", "钴蓝", "钢青", "灰蓝",
  "海绿", "橄榄", "金色", "橘色", "绯红", "石墨",
  // 25-30: black card variants
  "黑·白", "黑·金", "黑·银", "黑·香槟", "黑·冰蓝", "黑·翡翠",
] as const;

/**
 * Build inline CSS gradient style for a card based on colorIndex (1-30).
 * Uses the corresponding --chart-N CSS variable to create a rich gradient.
 * Returns a CSS `background` value for inline style usage.
 */
export function getCardGradient(colorIndex: number): string {
  const token = `--chart-${colorIndex}`;
  // Three-stop gradient: slightly brighter → base → darker
  return `linear-gradient(135deg, hsl(var(${token}) / 0.85) 0%, hsl(var(${token})) 40%, hsl(var(${token}) / 0.7) 100%)`;
}

/**
 * Get the progress bar fill color for a card based on colorIndex.
 * Uses a lighter tint of the card's base color for 1-24,
 * and the accent text color for 25-30 black cards.
 */
export function getCardProgressFill(colorIndex: number): string {
  if (colorIndex >= 25 && colorIndex <= 30) {
    const scheme = CARD_TEXT_SCHEMES[colorIndex - 25];
    return scheme.progressFill;
  }
  return `hsl(var(--chart-${colorIndex}) / 0.5)`;
}

// ── Black card text color schemes (colorIndex 25-30) ──

export interface CardTextScheme {
  /** CSS color for primary text (card name, card number) */
  textPrimary: string;
  /** CSS color for secondary text (stats, phone) */
  textSecondary: string;
  /** CSS color for muted text (labels) */
  textMuted: string;
  /** CSS color for progress bar fill */
  progressFill: string;
}

/**
 * Text color schemes for black card variants (colorIndex 25-30).
 * Array index 0 = colorIndex 25, index 5 = colorIndex 30.
 */
export const CARD_TEXT_SCHEMES: readonly CardTextScheme[] = [
  // 25: Pure black + white
  {
    textPrimary: "hsl(0 0% 100%)",
    textSecondary: "hsl(0 0% 100% / 0.8)",
    textMuted: "hsl(0 0% 100% / 0.45)",
    progressFill: "hsl(0 0% 100% / 0.4)",
  },
  // 26: Jet black + gold
  {
    textPrimary: "hsl(43 80% 65%)",
    textSecondary: "hsl(43 70% 60% / 0.85)",
    textMuted: "hsl(43 50% 55% / 0.5)",
    progressFill: "hsl(43 80% 65% / 0.5)",
  },
  // 27: Charcoal + silver
  {
    textPrimary: "hsl(0 0% 78%)",
    textSecondary: "hsl(0 0% 72% / 0.85)",
    textMuted: "hsl(0 0% 65% / 0.55)",
    progressFill: "hsl(0 0% 78% / 0.45)",
  },
  // 28: Warm black + champagne
  {
    textPrimary: "hsl(35 55% 72%)",
    textSecondary: "hsl(35 45% 66% / 0.85)",
    textMuted: "hsl(35 35% 58% / 0.5)",
    progressFill: "hsl(35 55% 72% / 0.45)",
  },
  // 29: Cool black + ice blue
  {
    textPrimary: "hsl(200 80% 72%)",
    textSecondary: "hsl(200 65% 66% / 0.85)",
    textMuted: "hsl(200 45% 58% / 0.5)",
    progressFill: "hsl(200 80% 72% / 0.45)",
  },
  // 30: Dark forest + jade
  {
    textPrimary: "hsl(160 60% 62%)",
    textSecondary: "hsl(160 50% 56% / 0.85)",
    textMuted: "hsl(160 35% 50% / 0.5)",
    progressFill: "hsl(160 60% 62% / 0.45)",
  },
] as const;

/**
 * Get the text color scheme for a colorIndex.
 * Returns a CardTextScheme for black cards (25-30), or null for chromatic cards (1-24).
 * Chromatic cards always use white text (handled by SourceCard defaults).
 */
export function getCardTextScheme(colorIndex: number): CardTextScheme | null {
  if (colorIndex >= 25 && colorIndex <= 30) {
    return CARD_TEXT_SCHEMES[colorIndex - 25];
  }
  return null;
}
