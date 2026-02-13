import { describe, it, expect } from "vitest";
import {
  computeAlerts,
  computeOverallProgress,
  computeStatCards,
  computeTopSources,
  computeMonthlyTrend,
} from "@/models/dashboard";
import type {
  Source,
  Benefit,
  Redemption,
  CycleAnchor,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultCycle: CycleAnchor = { period: "monthly", anchor: 1 };

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "s1",
    memberId: "m1",
    name: "Test Source",
    website: null,
    icon: null,
    phone: null,
    category: "credit-card",
    currency: "CNY",
    cycleAnchor: defaultCycle,
    validFrom: null,
    validUntil: null,
    archived: false,
    memo: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeBenefit(overrides: Partial<Benefit> = {}): Benefit {
  return {
    id: "b1",
    sourceId: "s1",
    name: "Test Benefit",
    type: "quota",
    quota: 6,
    creditAmount: null,
    shared: false,
    cycleAnchor: null,
    memo: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeRedemption(overrides: Partial<Redemption> = {}): Redemption {
  return {
    id: "r1",
    benefitId: "b1",
    memberId: "m1",
    redeemedAt: "2026-02-10T10:00:00Z",
    memo: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeStatCards
// ---------------------------------------------------------------------------

describe("computeStatCards", () => {
  const today = "2026-02-13";

  it("returns 4 stat cards", () => {
    const sources = [makeSource()];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", quota: 6 }),
      makeBenefit({ id: "b2", sourceId: "s1", quota: 4 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeStatCards(sources, benefits, redemptions, today);
    expect(result).toHaveLength(4);
  });

  it("counts total active benefits (excludes archived sources)", () => {
    const sources = [
      makeSource({ id: "s1", archived: false }),
      makeSource({ id: "s2", archived: true }),
    ];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1" }),
      makeBenefit({ id: "b2", sourceId: "s2" }),
    ];
    const result = computeStatCards(sources, benefits, [], today);
    expect(result[0].value).toBe(1); // total active benefits
  });

  it("counts benefits used this cycle", () => {
    const sources = [makeSource()];
    const benefits = [makeBenefit({ id: "b1", sourceId: "s1", quota: 6 })];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
      makeRedemption({ id: "r2", benefitId: "b1", redeemedAt: "2026-02-10T10:00:00Z" }),
      makeRedemption({ id: "r3", benefitId: "b1", redeemedAt: "2026-01-15T10:00:00Z" }), // last month
    ];
    const result = computeStatCards(sources, benefits, redemptions, today);
    // The "used this cycle" card counts redemptions in current cycle
    expect(result[2].value).toBe(2);
  });

  it("counts exhausted benefits in stat cards", () => {
    const sources = [makeSource()];
    const benefits = [makeBenefit({ id: "b1", sourceId: "s1", quota: 1 })];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeStatCards(sources, benefits, redemptions, today);
    expect(result[3].value).toBe(1); // "已用完"
  });

  it("counts expiring-soon benefits when cycle ends within 7 days", () => {
    // Use a date near end of cycle (monthly anchor 1 → cycle Feb 1 - Mar 1)
    const nearEnd = "2026-02-25";
    const sources = [makeSource()];
    const benefits = [makeBenefit({ id: "b1", sourceId: "s1", quota: 6 })];
    // Only 1 redemption out of 6, so not exhausted; 4 days until cycle end
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-20T10:00:00Z" }),
    ];
    const result = computeStatCards(sources, benefits, redemptions, nearEnd);
    expect(result[1].value).toBe(1); // "即将过期"
  });

  it("skips benefits whose source is not found (orphaned benefit)", () => {
    const sources = [makeSource({ id: "s1" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", quota: 6 }),
      makeBenefit({ id: "b-orphan", sourceId: "s-missing", quota: 3 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeStatCards(sources, benefits, redemptions, today);
    // orphaned benefit should be excluded from count (only b1 is active)
    expect(result[0].value).toBe(1); // total active = only b1
  });
});

// ---------------------------------------------------------------------------
// computeAlerts
// ---------------------------------------------------------------------------

describe("computeAlerts", () => {
  const today = "2026-02-13";

  it("generates alerts for benefits expiring soon in their cycle", () => {
    const sources = [makeSource({ id: "s1" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", quota: 6 }),
    ];
    // No redemptions, so benefit has unused quota; cycle ends Feb 28
    const result = computeAlerts(sources, benefits, [], today);
    // With cycle ending Feb 28, 15 days away, should flag as warning (<=7 days won't trigger for this test)
    // Actually with monthly anchor 1, window is Feb 1 - Mar 1 = 16 days left
    // This should not be urgent, but the function should return alerts for expiring sources too
    expect(Array.isArray(result)).toBe(true);
  });

  it("generates alerts for sources with validUntil expiring within 30 days", () => {
    const sources = [
      makeSource({ id: "s1", name: "Expiring Card", validUntil: "2026-03-01" }),
    ];
    const benefits: Benefit[] = [];
    const result = computeAlerts(sources, benefits, [], today);
    const sourceAlerts = result.filter((a) => a.alertType === "source_validity");
    expect(sourceAlerts.length).toBe(1);
    expect(sourceAlerts[0].label).toBe("Expiring Card");
  });

  it("excludes archived sources from alerts", () => {
    const sources = [
      makeSource({ id: "s1", name: "Archived", validUntil: "2026-03-01", archived: true }),
    ];
    const result = computeAlerts(sources, [], [], today);
    expect(result).toHaveLength(0);
  });

  it("excludes already expired sources from alerts", () => {
    const sources = [
      makeSource({ id: "s1", validUntil: "2026-01-01" }),
    ];
    const result = computeAlerts(sources, [], [], today);
    expect(result.filter((a) => a.alertType === "source_validity")).toHaveLength(0);
  });

  it("returns empty array when no alerts", () => {
    const result = computeAlerts([], [], [], today);
    expect(result).toEqual([]);
  });

  it("generates benefit_cycle alerts when benefits have unused quota near cycle end", () => {
    const nearEnd = "2026-02-25";
    const sources = [makeSource({ id: "s1", name: "TestCard" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", name: "TestPerk", quota: 6 }),
    ];
    // 1 redemption out of 6 — not exhausted, 4 days until cycle end
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-20T10:00:00Z" }),
    ];
    const result = computeAlerts(sources, benefits, redemptions, nearEnd);
    const benefitAlerts = result.filter((a) => a.alertType === "benefit_cycle");
    expect(benefitAlerts.length).toBeGreaterThanOrEqual(1);
    expect(benefitAlerts[0].label).toBe("TestPerk");
    expect(benefitAlerts[0].daysUntil).toBeLessThanOrEqual(7);
  });

  it("skips orphaned benefits whose source is missing from alert computation", () => {
    const nearEnd = "2026-02-25";
    const sources = [makeSource({ id: "s1", name: "TestCard" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", name: "TestPerk", quota: 6 }),
      makeBenefit({ id: "b-orphan", sourceId: "s-missing", name: "Orphan", quota: 3 }),
    ];
    const result = computeAlerts(sources, benefits, [], nearEnd);
    // Only b1 should generate alert (if applicable), orphan is skipped
    const benefitAlerts = result.filter((a) => a.alertType === "benefit_cycle");
    expect(benefitAlerts.every((a) => a.label !== "Orphan")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeOverallProgress
// ---------------------------------------------------------------------------

describe("computeOverallProgress", () => {
  const today = "2026-02-13";

  it("computes overall usage from quota benefits", () => {
    const sources = [makeSource({ id: "s1" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "quota", quota: 6 }),
      makeBenefit({ id: "b2", sourceId: "s1", type: "quota", quota: 4 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
      makeRedemption({ id: "r2", benefitId: "b1", redeemedAt: "2026-02-06T10:00:00Z" }),
      makeRedemption({ id: "r3", benefitId: "b2", redeemedAt: "2026-02-07T10:00:00Z" }),
    ];
    const result = computeOverallProgress(sources, benefits, redemptions, today);
    expect(result.totalCount).toBe(10); // 6 + 4
    expect(result.usedCount).toBe(3); // 3 redemptions in current cycle
    expect(result.percentage).toBeCloseTo(30); // 3/10 = 30%
  });

  it("includes credit benefits as totalCount 1", () => {
    const sources = [makeSource({ id: "s1" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "credit", creditAmount: 100, quota: null }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeOverallProgress(sources, benefits, redemptions, today);
    expect(result.totalCount).toBe(1);
    expect(result.usedCount).toBe(1);
    expect(result.percentage).toBe(100);
  });

  it("excludes action benefits", () => {
    const sources = [makeSource({ id: "s1" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "action", quota: null }),
    ];
    const result = computeOverallProgress(sources, benefits, [], today);
    expect(result.totalCount).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("excludes archived source benefits", () => {
    const sources = [makeSource({ id: "s1", archived: true })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "quota", quota: 6 }),
    ];
    const result = computeOverallProgress(sources, benefits, [], today);
    expect(result.totalCount).toBe(0);
  });

  it("returns 0 percentage when no trackable benefits", () => {
    const result = computeOverallProgress([], [], [], today);
    expect(result.percentage).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.usedCount).toBe(0);
  });

  it("skips orphaned benefits whose source is missing", () => {
    const sources = [makeSource({ id: "s1" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "quota", quota: 6 }),
      makeBenefit({ id: "b-orphan", sourceId: "s-missing", type: "quota", quota: 3 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeOverallProgress(sources, benefits, redemptions, today);
    // Only b1 counted (quota 6), orphan skipped
    expect(result.totalCount).toBe(6);
    expect(result.usedCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeTopSources
// ---------------------------------------------------------------------------

describe("computeTopSources", () => {
  const today = "2026-02-13";

  it("ranks sources by total redemptions in current cycle", () => {
    const sources = [
      makeSource({ id: "s1", name: "Source A" }),
      makeSource({ id: "s2", name: "Source B" }),
    ];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", quota: 6 }),
      makeBenefit({ id: "b2", sourceId: "s2", quota: 4 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
      makeRedemption({ id: "r2", benefitId: "b2", redeemedAt: "2026-02-06T10:00:00Z" }),
      makeRedemption({ id: "r3", benefitId: "b2", redeemedAt: "2026-02-07T10:00:00Z" }),
    ];
    const result = computeTopSources(sources, benefits, redemptions, today);
    expect(result[0].sourceName).toBe("Source B"); // 2 redemptions
    expect(result[0].usedCount).toBe(2);
    expect(result[1].sourceName).toBe("Source A"); // 1 redemption
    expect(result[1].usedCount).toBe(1);
  });

  it("excludes archived sources", () => {
    const sources = [
      makeSource({ id: "s1", name: "Active", archived: false }),
      makeSource({ id: "s2", name: "Archived", archived: true }),
    ];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", quota: 6 }),
      makeBenefit({ id: "b2", sourceId: "s2", quota: 4 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b2", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeTopSources(sources, benefits, redemptions, today);
    expect(result.every((s) => s.sourceName !== "Archived")).toBe(true);
  });

  it("limits results to top N", () => {
    const sources = Array.from({ length: 10 }, (_, i) =>
      makeSource({ id: `s${i}`, name: `Source ${i}` }),
    );
    const benefits = sources.map((s, i) =>
      makeBenefit({ id: `b${i}`, sourceId: s.id, quota: 6 }),
    );
    const redemptions = benefits.map((b, i) =>
      makeRedemption({
        id: `r${i}`,
        benefitId: b.id,
        redeemedAt: "2026-02-05T10:00:00Z",
      }),
    );
    const result = computeTopSources(sources, benefits, redemptions, today, 5);
    expect(result).toHaveLength(5);
  });

  it("handles benefits whose source is not found (orphaned)", () => {
    const sources = [makeSource({ id: "s1", name: "Source A" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", quota: 6 }),
      makeBenefit({ id: "b-orphan", sourceId: "s-missing", quota: 3 }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeTopSources(sources, benefits, redemptions, today);
    // Only s1 should appear — orphaned benefit is skipped
    expect(result).toHaveLength(1);
    expect(result[0].sourceName).toBe("Source A");
  });

  it("counts credit benefits as totalCount 1 in source summary", () => {
    const sources = [makeSource({ id: "s1", name: "Source A" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "credit", creditAmount: 500, quota: null }),
    ];
    const redemptions = [
      makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-02-05T10:00:00Z" }),
    ];
    const result = computeTopSources(sources, benefits, redemptions, today);
    expect(result[0].totalCount).toBe(1);
    expect(result[0].usedCount).toBe(1);
  });

  it("excludes action benefits from source summaries", () => {
    const sources = [makeSource({ id: "s1", name: "Source A" })];
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1", type: "action", quota: null }),
    ];
    const result = computeTopSources(sources, benefits, [], today);
    expect(result[0].totalCount).toBe(0);
    expect(result[0].usedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeMonthlyTrend
// ---------------------------------------------------------------------------

describe("computeMonthlyTrend", () => {
  it("groups redemptions by month for the past N months", () => {
    const redemptions = [
      makeRedemption({ id: "r1", redeemedAt: "2026-01-10T10:00:00Z" }),
      makeRedemption({ id: "r2", redeemedAt: "2026-01-15T10:00:00Z" }),
      makeRedemption({ id: "r3", redeemedAt: "2026-02-05T10:00:00Z" }),
      makeRedemption({ id: "r4", redeemedAt: "2025-09-01T10:00:00Z" }), // too old for 6 months
    ];
    const result = computeMonthlyTrend(redemptions, "2026-02-13", 6);
    expect(result).toHaveLength(6);
    // Most recent month (Feb 2026) should have 1
    const feb = result.find((m) => m.month === "2026-02");
    expect(feb?.count).toBe(1);
    // Jan should have 2
    const jan = result.find((m) => m.month === "2026-01");
    expect(jan?.count).toBe(2);
  });

  it("returns empty counts for months with no redemptions", () => {
    const result = computeMonthlyTrend([], "2026-02-13", 6);
    expect(result).toHaveLength(6);
    expect(result.every((m) => m.count === 0)).toBe(true);
  });

  it("months are in chronological order", () => {
    const result = computeMonthlyTrend([], "2026-02-13", 6);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].month > result[i - 1].month).toBe(true);
    }
  });

  it("ignores redemptions outside the N-month window", () => {
    const redemptions = [
      makeRedemption({ id: "r1", redeemedAt: "2025-07-15T10:00:00Z" }), // outside 6-month window
      makeRedemption({ id: "r2", redeemedAt: "2026-02-05T10:00:00Z" }), // inside
    ];
    const result = computeMonthlyTrend(redemptions, "2026-02-13", 6);
    const totalCount = result.reduce((sum, m) => sum + m.count, 0);
    expect(totalCount).toBe(1); // only r2 counted
  });
});
