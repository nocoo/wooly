// Centralized chart / visualization color palette.
// All values reference CSS custom properties defined in globals.css.
// Use these constants everywhere instead of hardcoded HSL strings.

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

// ── Card color schemes (24 schemes for SourceCard backgrounds) ──

/** Semantic labels for the 24 chart colors */
export const CHART_COLOR_LABELS = [
  "品红", "天蓝", "青色", "翡翠", "绿色", "青柠",
  "琥珀", "橙色", "朱红", "红色", "玫红", "蓝色",
  "兰花", "紫色", "靛蓝", "钴蓝", "钢青", "灰蓝",
  "海绿", "橄榄", "金色", "橘色", "绯红", "石墨",
] as const;

/**
 * Build inline CSS gradient style for a card based on colorIndex (1-24).
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
 * Uses a lighter tint of the card's base color.
 */
export function getCardProgressFill(colorIndex: number): string {
  return `hsl(var(--chart-${colorIndex}) / 0.5)`;
}
