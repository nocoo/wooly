// Pure business logic for dashboard aggregation.
// No React dependency — fully testable with plain unit tests.

import type {
  Source,
  Benefit,
  Redemption,
} from "@/models/types";
import {
  resolveCycleAnchor,
  getCurrentCycleWindow,
  getDaysUntilCycleEnd,
  countRedemptionsInWindow,
} from "@/models/cycle";
import { classifyBenefitUrgency } from "@/models/benefit";
import { isSourceExpiringSoon, isSourceExpired } from "@/models/source";

// ---------------------------------------------------------------------------
// Types (dashboard-specific, not in types.ts)
// ---------------------------------------------------------------------------

export interface StatCard {
  label: string;
  value: number;
}

export interface AlertItem {
  id: string;
  label: string;
  sourceName: string;
  alertType: "benefit_cycle" | "source_validity";
  daysUntil: number;
  urgency: "urgent" | "warning" | "normal";
}

export interface SourceSummary {
  sourceId: string;
  sourceName: string;
  usedCount: number;
  totalCount: number;
}

export interface MonthlyBar {
  month: string; // YYYY-MM
  count: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Get the set of active (non-archived) source IDs */
function getActiveSourceIds(sources: readonly Source[]): Set<string> {
  return new Set(sources.filter((s) => !s.archived).map((s) => s.id));
}

/** Get active benefits (whose source is not archived) */
function getActiveBenefits(
  benefits: readonly Benefit[],
  activeSourceIds: Set<string>,
): Benefit[] {
  return benefits.filter((b) => activeSourceIds.has(b.sourceId));
}

// ---------------------------------------------------------------------------
// computeStatCards
// ---------------------------------------------------------------------------

/**
 * Compute the 4 stat cards for the dashboard header.
 * Cards: 总权益数, 即将过期, 本月已用, 已用完
 */
export function computeStatCards(
  sources: readonly Source[],
  benefits: readonly Benefit[],
  redemptions: readonly Redemption[],
  today: string,
): StatCard[] {
  const activeSourceIds = getActiveSourceIds(sources);
  const activeBenefits = getActiveBenefits(benefits, activeSourceIds);
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // Total active benefits (exclude action type from trackable count? No, count all active)
  const totalBenefits = activeBenefits.length;

  // Expiring soon: benefits with cycle ending within 7 days + unused quota
  let expiringSoon = 0;
  let usedThisCycle = 0;
  let exhausted = 0;

  for (const benefit of activeBenefits) {
    if (benefit.type === "action") continue;

    const source = sourceMap.get(benefit.sourceId);
    if (!source) continue;

    const anchor = resolveCycleAnchor(benefit.cycleAnchor, source.cycleAnchor);
    const window = getCurrentCycleWindow(today, anchor);
    const benefitRedemptions = redemptions.filter((r) => r.benefitId === benefit.id);
    const usedCount = countRedemptionsInWindow(
      benefitRedemptions as Redemption[],
      window,
    );
    const daysUntilEnd = getDaysUntilCycleEnd(today, window);

    usedThisCycle += usedCount;

    const totalCount = benefit.type === "quota" ? (benefit.quota ?? 0) : 1;

    if (usedCount >= totalCount) {
      exhausted++;
    } else if (daysUntilEnd <= 7) {
      expiringSoon++;
    }
  }

  return [
    { label: "总权益数", value: totalBenefits },
    { label: "即将过期", value: expiringSoon },
    { label: "本月已用", value: usedThisCycle },
    { label: "已用完", value: exhausted },
  ];
}

// ---------------------------------------------------------------------------
// computeAlerts
// ---------------------------------------------------------------------------

/**
 * Compute alert items for the dashboard.
 * Includes: benefits with unused quota expiring soon + sources with validUntil expiring.
 * Sorted by daysUntil ascending (most urgent first).
 */
export function computeAlerts(
  sources: readonly Source[],
  benefits: readonly Benefit[],
  redemptions: readonly Redemption[],
  today: string,
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const activeSourceIds = getActiveSourceIds(sources);
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // 1. Benefit cycle alerts: benefits with unused quota and cycle ending within 7 days
  const activeBenefits = getActiveBenefits(benefits, activeSourceIds);
  for (const benefit of activeBenefits) {
    if (benefit.type === "action") continue;

    const source = sourceMap.get(benefit.sourceId);
    if (!source) continue;

    const anchor = resolveCycleAnchor(benefit.cycleAnchor, source.cycleAnchor);
    const window = getCurrentCycleWindow(today, anchor);
    const benefitRedemptions = redemptions.filter((r) => r.benefitId === benefit.id);
    const usedCount = countRedemptionsInWindow(
      benefitRedemptions as Redemption[],
      window,
    );
    const totalCount = benefit.type === "quota" ? (benefit.quota ?? 0) : 1;
    const daysUntilEnd = getDaysUntilCycleEnd(today, window);

    if (usedCount < totalCount && daysUntilEnd <= 7) {
      const urgency = classifyBenefitUrgency(daysUntilEnd);
      alerts.push({
        id: `benefit-${benefit.id}`,
        label: benefit.name,
        sourceName: source.name,
        alertType: "benefit_cycle",
        daysUntil: daysUntilEnd,
        urgency,
      });
    }
  }

  // 2. Source validity alerts: sources with validUntil expiring within 30 days
  for (const source of sources) {
    if (source.archived) continue;
    if (isSourceExpired(source, today)) continue;
    if (isSourceExpiringSoon(source, today, 30)) {
      const todayMs = new Date(today).getTime();
      const untilMs = new Date(source.validUntil!).getTime();
      const daysUntil = Math.ceil((untilMs - todayMs) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `source-${source.id}`,
        label: source.name,
        sourceName: source.name,
        alertType: "source_validity",
        daysUntil,
        urgency: daysUntil <= 7 ? "urgent" : "warning",
      });
    }
  }

  // Sort by urgency (most urgent first)
  alerts.sort((a, b) => a.daysUntil - b.daysUntil);

  return alerts;
}

// ---------------------------------------------------------------------------
// computeOverallProgress
// ---------------------------------------------------------------------------

/**
 * Compute overall usage progress across all active, trackable benefits.
 * Excludes action type and archived sources.
 */
export function computeOverallProgress(
  sources: readonly Source[],
  benefits: readonly Benefit[],
  redemptions: readonly Redemption[],
  today: string,
): { usedCount: number; totalCount: number; percentage: number } {
  const activeSourceIds = getActiveSourceIds(sources);
  const activeBenefits = getActiveBenefits(benefits, activeSourceIds);
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  let totalCount = 0;
  let usedCount = 0;

  for (const benefit of activeBenefits) {
    if (benefit.type === "action") continue;

    const source = sourceMap.get(benefit.sourceId);
    if (!source) continue;

    const anchor = resolveCycleAnchor(benefit.cycleAnchor, source.cycleAnchor);
    const window = getCurrentCycleWindow(today, anchor);
    const benefitRedemptions = redemptions.filter((r) => r.benefitId === benefit.id);
    const count = countRedemptionsInWindow(
      benefitRedemptions as Redemption[],
      window,
    );

    if (benefit.type === "quota") {
      totalCount += benefit.quota ?? 0;
    } else {
      totalCount += 1; // credit
    }
    usedCount += Math.min(
      count,
      benefit.type === "quota" ? (benefit.quota ?? 0) : 1,
    );
  }

  const percentage = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

  return { usedCount, totalCount, percentage };
}

// ---------------------------------------------------------------------------
// computeTopSources
// ---------------------------------------------------------------------------

/**
 * Rank active sources by total redemptions in the current cycle.
 * Returns top N sources, sorted descending by usage.
 */
export function computeTopSources(
  sources: readonly Source[],
  benefits: readonly Benefit[],
  redemptions: readonly Redemption[],
  today: string,
  limit: number = 5,
): SourceSummary[] {
  const activeSourceIds = getActiveSourceIds(sources);
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  const summaryMap = new Map<string, SourceSummary>();

  for (const source of sources) {
    if (!activeSourceIds.has(source.id)) continue;
    summaryMap.set(source.id, {
      sourceId: source.id,
      sourceName: source.name,
      usedCount: 0,
      totalCount: 0,
    });
  }

  for (const benefit of benefits) {
    if (!activeSourceIds.has(benefit.sourceId)) continue;
    if (benefit.type === "action") continue;

    const source = sourceMap.get(benefit.sourceId);
    if (!source) continue;

    const anchor = resolveCycleAnchor(benefit.cycleAnchor, source.cycleAnchor);
    const window = getCurrentCycleWindow(today, anchor);
    const benefitRedemptions = redemptions.filter((r) => r.benefitId === benefit.id);
    const count = countRedemptionsInWindow(
      benefitRedemptions as Redemption[],
      window,
    );

    const summary = summaryMap.get(benefit.sourceId)!;
    summary.usedCount += count;
    summary.totalCount += benefit.type === "quota" ? (benefit.quota ?? 0) : 1;
  }

  return Array.from(summaryMap.values())
    .sort((a, b) => b.usedCount - a.usedCount)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// computeMonthlyTrend
// ---------------------------------------------------------------------------

/**
 * Group redemptions by month for the past N months.
 * Returns array in chronological order.
 */
export function computeMonthlyTrend(
  redemptions: readonly Redemption[],
  today: string,
  months: number = 6,
): MonthlyBar[] {
  const [year, month] = today.split("-").map(Number);

  // Generate month keys in chronological order
  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const total = (month - 1) - i;
    const my = year + Math.floor(total / 12);
    const mm = ((total % 12) + 12) % 12 + 1;
    monthKeys.push(`${my}-${String(mm).padStart(2, "0")}`);
  }

  // Count redemptions per month
  const counts = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const r of redemptions) {
    const key = r.redeemedAt.slice(0, 7); // YYYY-MM
    if (counts.has(key)) {
      counts.set(key, counts.get(key)! + 1);
    }
  }

  return monthKeys.map((k) => ({ month: k, count: counts.get(k) ?? 0 }));
}
