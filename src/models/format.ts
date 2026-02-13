// ---------------------------------------------------------------------------
// Format utilities — pure functions for display formatting
// ---------------------------------------------------------------------------

import type { CycleAnchor } from "@/models/types";

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

/** Currency symbol mapping */
const CURRENCY_SYMBOLS: Record<string, { symbol: string; decimals: number }> = {
  CNY: { symbol: "¥", decimals: 0 },
  JPY: { symbol: "¥", decimals: 0 },
  USD: { symbol: "$", decimals: 2 },
  EUR: { symbol: "€", decimals: 2 },
  GBP: { symbol: "£", decimals: 2 },
};

/**
 * Format a monetary amount with its currency symbol.
 *
 * @param amount - The numeric amount
 * @param currency - ISO 4217 currency code (e.g. "CNY", "USD")
 * @returns Formatted string like "¥300" or "$99.50"
 */
export function formatCurrency(amount: number, currency: string): string {
  const config = CURRENCY_SYMBOLS[currency];
  if (config) {
    const formatted =
      config.decimals > 0 ? amount.toFixed(config.decimals) : String(amount);
    return `${config.symbol}${formatted}`;
  }
  return `${currency} ${amount}`;
}

// ---------------------------------------------------------------------------
// Cycle label formatting
// ---------------------------------------------------------------------------

/**
 * Format a CycleAnchor as a human-readable Chinese label.
 *
 * @param anchor - Cycle anchor configuration
 * @returns e.g. "每月25日", "每年5月20日", "每季度（1月1日起）"
 */
export function formatCycleLabel(anchor: CycleAnchor): string {
  switch (anchor.period) {
    case "monthly":
      return `每月${anchor.anchor as number}日`;
    case "yearly": {
      const a = anchor.anchor as { month: number; day: number };
      return `每年${a.month}月${a.day}日`;
    }
    case "quarterly": {
      const a = anchor.anchor as { month: number; day: number };
      return `每季度（${a.month}月${a.day}日起）`;
    }
  }
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date range for display.
 * If both dates are in the current year, omits the year prefix.
 * Otherwise includes the full year.
 *
 * @param start - Start date YYYY-MM-DD
 * @param end - End date YYYY-MM-DD
 * @returns e.g. "01/25 – 02/25" or "2025/12/15 – 2026/12/15"
 */
export function formatDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-");
  const [ey, em, ed] = end.split("-");
  const currentYear = new Date().getFullYear().toString();

  if (sy === currentYear && ey === currentYear) {
    return `${sm}/${sd} – ${em}/${ed}`;
  }
  return `${sy}/${sm}/${sd} – ${ey}/${em}/${ed}`;
}

/**
 * Format a number of days as a human-readable Chinese label.
 *
 * @param days - Number of days (positive = future, 0 = today, negative = past)
 * @returns e.g. "5天后", "今天", "已过期"
 */
export function formatDaysUntil(days: number): string {
  if (days < 0) return "已过期";
  if (days === 0) return "今天";
  return `${days}天后`;
}

/**
 * Format a Date object as a YYYY-MM-DD string in the given timezone.
 *
 * @param date - JS Date object (UTC timestamp)
 * @param timezone - IANA timezone identifier (e.g. "Asia/Shanghai")
 * @returns Local date string in YYYY-MM-DD format
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  return `${year}-${month}-${day}`;
}
