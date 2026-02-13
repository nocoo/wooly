// ---------------------------------------------------------------------------
// Cycle engine — pure functions for cycle window calculation
// ---------------------------------------------------------------------------

import type {
  CycleAnchor,
  CycleWindow,
  Benefit,
  Redemption,
  BenefitCycleInfo,
  BenefitCycleStatus,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Extract anchor as a day-of-month number (for monthly cycles) */
export function anchorAsDay(anchor: CycleAnchor): number {
  if (typeof anchor.anchor === "number") return anchor.anchor;
  return anchor.anchor.day;
}

/** Extract anchor as { month, day } (for quarterly/yearly cycles) */
export function anchorAsMonthDay(anchor: CycleAnchor): { month: number; day: number } {
  if (typeof anchor.anchor === "object") return anchor.anchor;
  return { month: 1, day: anchor.anchor };
}

/** Number of days in a given month (1-indexed) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clamp a day to the max days in the given month */
function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/** Format a date as YYYY-MM-DD */
function fmtDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into [year, month, day] */
function parseDate(s: string): [number, number, number] {
  const [y, m, d] = s.split("-").map(Number);
  return [y, m, d];
}

/** Calculate difference in days between two YYYY-MM-DD strings (b - a) */
function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/**
 * Add N months to a (year, month) pair, returning [newYear, newMonth].
 * Month is 1-indexed.
 */
function addMonths(year: number, month: number, n: number): [number, number] {
  // Convert to 0-indexed for arithmetic
  const total = (month - 1) + n;
  const newYear = year + Math.floor(total / 12);
  const newMonth = (total % 12 + 12) % 12 + 1;
  return [newYear, newMonth];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve the effective cycle anchor for a benefit.
 * Benefit-level config takes priority; falls back to source-level.
 */
export function resolveCycleAnchor(
  benefitAnchor: CycleAnchor | null,
  sourceAnchor: CycleAnchor,
): CycleAnchor {
  return benefitAnchor ?? sourceAnchor;
}

/**
 * Compute the cycle window [start, end) that contains the given date.
 *
 * @param today - Reference date, ISO 8601 (YYYY-MM-DD)
 * @param anchor - Cycle anchor configuration
 * @returns CycleWindow with start (inclusive) and end (exclusive)
 */
export function getCurrentCycleWindow(
  today: string,
  anchor: CycleAnchor,
): CycleWindow {
  const [year, month, day] = parseDate(today);

  switch (anchor.period) {
    case "monthly":
      return computeMonthlyWindow(year, month, day, anchorAsDay(anchor));
    case "yearly":
      return computeYearlyWindow(year, month, day, anchorAsMonthDay(anchor));
    case "quarterly":
      return computeQuarterlyWindow(year, month, day, anchorAsMonthDay(anchor));
  }
}

function computeMonthlyWindow(
  year: number,
  month: number,
  day: number,
  anchorDay: number,
): CycleWindow {
  const clampedThisMonth = clampDay(year, month, anchorDay);

  if (day >= clampedThisMonth) {
    // Window starts this month
    const [nextYear, nextMonth] = addMonths(year, month, 1);
    const clampedNext = clampDay(nextYear, nextMonth, anchorDay);
    return {
      start: fmtDate(year, month, clampedThisMonth),
      end: fmtDate(nextYear, nextMonth, clampedNext),
    };
  } else {
    // Window starts last month
    const [prevYear, prevMonth] = addMonths(year, month, -1);
    const clampedPrev = clampDay(prevYear, prevMonth, anchorDay);
    return {
      start: fmtDate(prevYear, prevMonth, clampedPrev),
      end: fmtDate(year, month, clampedThisMonth),
    };
  }
}

function computeYearlyWindow(
  year: number,
  month: number,
  day: number,
  anchorMD: { month: number; day: number },
): CycleWindow {
  const clampedThisYear = clampDay(year, anchorMD.month, anchorMD.day);
  const thisAnchorDate = fmtDate(year, anchorMD.month, clampedThisYear);

  const todayStr = fmtDate(year, month, day);

  if (todayStr >= thisAnchorDate) {
    const clampedNext = clampDay(year + 1, anchorMD.month, anchorMD.day);
    return {
      start: thisAnchorDate,
      end: fmtDate(year + 1, anchorMD.month, clampedNext),
    };
  } else {
    const clampedPrev = clampDay(year - 1, anchorMD.month, anchorMD.day);
    return {
      start: fmtDate(year - 1, anchorMD.month, clampedPrev),
      end: thisAnchorDate,
    };
  }
}

function computeQuarterlyWindow(
  year: number,
  month: number,
  day: number,
  anchorMD: { month: number; day: number },
): CycleWindow {
  // Generate the 4 quarter start months
  const quarterMonths: number[] = [];
  for (let i = 0; i < 4; i++) {
    const m = ((anchorMD.month - 1 + i * 3) % 12) + 1;
    quarterMonths.push(m);
  }

  const todayStr = fmtDate(year, month, day);

  // Build candidate quarter start dates around the current year
  // We need to check year-1, year, and year+1 to handle cross-year quarters
  interface Candidate {
    year: number;
    month: number;
    date: string;
  }

  const candidates: Candidate[] = [];
  for (const qy of [year - 2, year - 1, year, year + 1]) {
    for (const qm of quarterMonths) {
      const cd = clampDay(qy, qm, anchorMD.day);
      candidates.push({ year: qy, month: qm, date: fmtDate(qy, qm, cd) });
    }
  }

  // Sort by date
  candidates.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Find the largest candidate <= todayStr
  let startIdx = -1;
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (candidates[i].date <= todayStr) {
      startIdx = i;
      break;
    }
  }

  const startCandidate = candidates[startIdx];
  const endCandidate = candidates[startIdx + 1];

  return {
    start: startCandidate.date,
    end: endCandidate.date,
  };
}

/**
 * Calculate the number of days until the cycle ends.
 *
 * @param today - Reference date (YYYY-MM-DD)
 * @param window - Current cycle window
 * @returns Days remaining (>= 0)
 */
export function getDaysUntilCycleEnd(today: string, window: CycleWindow): number {
  return Math.max(0, diffDays(today, window.end));
}

/**
 * Check whether the cycle is expiring soon.
 *
 * @param daysUntilEnd - Days until cycle end
 * @param threshold - Threshold in days, defaults to 7
 * @returns Whether the cycle is expiring soon
 */
export function isCycleExpiringSoon(daysUntilEnd: number, threshold = 7): boolean {
  return daysUntilEnd > 0 && daysUntilEnd <= threshold;
}

/**
 * Count redemptions that fall within the given cycle window [start, end).
 *
 * @param redemptions - All redemptions for a benefit
 * @param window - Current cycle window
 * @returns Number of redemptions in the window
 */
export function countRedemptionsInWindow(
  redemptions: Redemption[],
  window: CycleWindow,
): number {
  return redemptions.filter((r) => {
    const date = r.redeemedAt.slice(0, 10);
    return date >= window.start && date < window.end;
  }).length;
}

/**
 * Compute the full cycle status for a benefit.
 *
 * @param benefit - The benefit to evaluate
 * @param sourceAnchor - The source's default cycle anchor
 * @param redemptions - All redemptions for this benefit
 * @param today - Reference date (YYYY-MM-DD)
 * @returns BenefitCycleInfo with all computed fields
 */
export function computeBenefitCycleStatus(
  benefit: Benefit,
  sourceAnchor: CycleAnchor,
  redemptions: Redemption[],
  today: string,
): BenefitCycleInfo {
  // Action type: no redemption tracking
  if (benefit.type === "action") {
    const anchor = resolveCycleAnchor(benefit.cycleAnchor, sourceAnchor);
    const window = getCurrentCycleWindow(today, anchor);
    const daysUntilEnd = getDaysUntilCycleEnd(today, window);
    return {
      window,
      usedCount: 0,
      totalCount: 0,
      usageRatio: 0,
      daysUntilEnd,
      isExpiringSoon: isCycleExpiringSoon(daysUntilEnd),
      status: "pending",
    };
  }

  const anchor = resolveCycleAnchor(benefit.cycleAnchor, sourceAnchor);
  const window = getCurrentCycleWindow(today, anchor);
  const usedCount = countRedemptionsInWindow(redemptions, window);
  const daysUntilEnd = getDaysUntilCycleEnd(today, window);
  const isExpiringSoon = isCycleExpiringSoon(daysUntilEnd);

  let totalCount: number;
  let status: BenefitCycleStatus;

  if (benefit.type === "quota") {
    totalCount = benefit.quota ?? 0;
    if (usedCount >= totalCount) {
      status = "exhausted";
    } else if (usedCount > 0) {
      status = "partially_used";
    } else {
      status = "available";
    }
  } else {
    // credit type
    totalCount = 1;
    status = usedCount >= 1 ? "exhausted" : "available";
  }

  // Overlay expiring_soon on non-exhausted statuses
  if ((status === "available" || status === "partially_used") && isExpiringSoon) {
    status = "expiring_soon";
  }

  const usageRatio = totalCount > 0 ? Math.min(usedCount / totalCount, 1) : 0;

  return {
    window,
    usedCount,
    totalCount,
    usageRatio,
    daysUntilEnd,
    isExpiringSoon,
    status,
  };
}
