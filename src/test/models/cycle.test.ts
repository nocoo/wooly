import { describe, it, expect } from "vitest";
import {
  resolveCycleAnchor,
  getCurrentCycleWindow,
  getDaysUntilCycleEnd,
  isCycleExpiringSoon,
  countRedemptionsInWindow,
  computeBenefitCycleStatus,
} from "@/models/cycle";
import type {
  CycleAnchor,
  Benefit,
  Redemption,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeRedemption(
  benefitId: string,
  redeemedAt: string,
  id?: string,
): Redemption {
  return {
    id: id ?? `r-${redeemedAt}`,
    benefitId,
    memberId: "m1",
    redeemedAt,
    memo: null,
  };
}

// ---------------------------------------------------------------------------
// resolveCycleAnchor
// ---------------------------------------------------------------------------

describe("resolveCycleAnchor", () => {
  const sourceAnchor: CycleAnchor = { period: "monthly", anchor: 1 };
  const benefitAnchor: CycleAnchor = { period: "yearly", anchor: { month: 5, day: 20 } };

  it("returns benefit anchor when provided", () => {
    expect(resolveCycleAnchor(benefitAnchor, sourceAnchor)).toEqual(benefitAnchor);
  });

  it("falls back to source anchor when benefit anchor is null", () => {
    expect(resolveCycleAnchor(null, sourceAnchor)).toEqual(sourceAnchor);
  });
});

// ---------------------------------------------------------------------------
// getCurrentCycleWindow — monthly
// ---------------------------------------------------------------------------

describe("getCurrentCycleWindow — monthly", () => {
  it("today after anchor day → window starts this month", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 25 };
    const w = getCurrentCycleWindow("2026-02-28", anchor);
    expect(w).toEqual({ start: "2026-02-25", end: "2026-03-25" });
  });

  it("today before anchor day → window starts last month", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 25 };
    const w = getCurrentCycleWindow("2026-02-13", anchor);
    expect(w).toEqual({ start: "2026-01-25", end: "2026-02-25" });
  });

  it("today exactly on anchor day → window starts today", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 25 };
    const w = getCurrentCycleWindow("2026-02-25", anchor);
    expect(w).toEqual({ start: "2026-02-25", end: "2026-03-25" });
  });

  it("anchor=31 in February → clamps to 28 (non-leap year)", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 31 };
    const w = getCurrentCycleWindow("2026-02-15", anchor);
    // Jan has 31 days, Feb has 28 → window [Jan 31, Feb 28)
    expect(w).toEqual({ start: "2026-01-31", end: "2026-02-28" });
  });

  it("anchor=31 and today is March 5 → window starts Feb 28", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 31 };
    const w = getCurrentCycleWindow("2026-03-05", anchor);
    // Feb has 28 days → clamp to 28; Mar has 31 days
    expect(w).toEqual({ start: "2026-02-28", end: "2026-03-31" });
  });

  it("anchor=1 natural month", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 1 };
    const w = getCurrentCycleWindow("2026-02-13", anchor);
    expect(w).toEqual({ start: "2026-02-01", end: "2026-03-01" });
  });

  it("monthly cycle crossing year boundary", () => {
    const anchor: CycleAnchor = { period: "monthly", anchor: 15 };
    const w = getCurrentCycleWindow("2026-01-05", anchor);
    expect(w).toEqual({ start: "2025-12-15", end: "2026-01-15" });
  });
});

// ---------------------------------------------------------------------------
// getCurrentCycleWindow — yearly
// ---------------------------------------------------------------------------

describe("getCurrentCycleWindow — yearly", () => {
  it("today after anchor → window starts this year", () => {
    const anchor: CycleAnchor = { period: "yearly", anchor: { month: 5, day: 20 } };
    const w = getCurrentCycleWindow("2026-06-01", anchor);
    expect(w).toEqual({ start: "2026-05-20", end: "2027-05-20" });
  });

  it("today before anchor → window starts last year", () => {
    const anchor: CycleAnchor = { period: "yearly", anchor: { month: 5, day: 20 } };
    const w = getCurrentCycleWindow("2026-02-13", anchor);
    expect(w).toEqual({ start: "2025-05-20", end: "2026-05-20" });
  });

  it("today exactly on anchor day → window starts today", () => {
    const anchor: CycleAnchor = { period: "yearly", anchor: { month: 5, day: 20 } };
    const w = getCurrentCycleWindow("2026-05-20", anchor);
    expect(w).toEqual({ start: "2026-05-20", end: "2027-05-20" });
  });

  it("natural year (Jan 1)", () => {
    const anchor: CycleAnchor = { period: "yearly", anchor: { month: 1, day: 1 } };
    const w = getCurrentCycleWindow("2026-07-15", anchor);
    expect(w).toEqual({ start: "2026-01-01", end: "2027-01-01" });
  });

  it("anchor Feb 29 in non-leap year → clamps to Feb 28", () => {
    const anchor: CycleAnchor = { period: "yearly", anchor: { month: 2, day: 29 } };
    // 2026 is not a leap year
    const w = getCurrentCycleWindow("2026-03-15", anchor);
    expect(w).toEqual({ start: "2026-02-28", end: "2027-02-28" });
  });

  it("cross-year: anchor Dec 15, today Jan 10", () => {
    const anchor: CycleAnchor = { period: "yearly", anchor: { month: 12, day: 15 } };
    const w = getCurrentCycleWindow("2026-01-10", anchor);
    expect(w).toEqual({ start: "2025-12-15", end: "2026-12-15" });
  });
});

// ---------------------------------------------------------------------------
// getCurrentCycleWindow — quarterly
// ---------------------------------------------------------------------------

describe("getCurrentCycleWindow — quarterly", () => {
  it("standard Q1 (anchor Jan 1)", () => {
    const anchor: CycleAnchor = { period: "quarterly", anchor: { month: 1, day: 1 } };
    const w = getCurrentCycleWindow("2026-02-13", anchor);
    expect(w).toEqual({ start: "2026-01-01", end: "2026-04-01" });
  });

  it("standard Q2", () => {
    const anchor: CycleAnchor = { period: "quarterly", anchor: { month: 1, day: 1 } };
    const w = getCurrentCycleWindow("2026-05-15", anchor);
    expect(w).toEqual({ start: "2026-04-01", end: "2026-07-01" });
  });

  it("cross-year quarterly (anchor Nov 1)", () => {
    const anchor: CycleAnchor = { period: "quarterly", anchor: { month: 11, day: 1 } };
    const w = getCurrentCycleWindow("2026-12-15", anchor);
    // Quarter months: 11, 2, 5, 8
    // Dec 15 is in [Nov 1, Feb 1+1y)
    expect(w).toEqual({ start: "2026-11-01", end: "2027-02-01" });
  });

  it("cross-year quarterly, today in Jan", () => {
    const anchor: CycleAnchor = { period: "quarterly", anchor: { month: 11, day: 1 } };
    const w = getCurrentCycleWindow("2026-01-15", anchor);
    // Quarter months: 11, 2, 5, 8
    // Jan 15 is in [2025-11-01, 2026-02-01)
    expect(w).toEqual({ start: "2025-11-01", end: "2026-02-01" });
  });

  it("exactly on quarter start", () => {
    const anchor: CycleAnchor = { period: "quarterly", anchor: { month: 1, day: 1 } };
    const w = getCurrentCycleWindow("2026-04-01", anchor);
    expect(w).toEqual({ start: "2026-04-01", end: "2026-07-01" });
  });

  it("quarter anchor with day > 1", () => {
    const anchor: CycleAnchor = { period: "quarterly", anchor: { month: 3, day: 15 } };
    const w = getCurrentCycleWindow("2026-04-10", anchor);
    // Quarter months: 3, 6, 9, 12
    // Apr 10 is in [Mar 15, Jun 15)
    expect(w).toEqual({ start: "2026-03-15", end: "2026-06-15" });
  });
});

// ---------------------------------------------------------------------------
// getDaysUntilCycleEnd
// ---------------------------------------------------------------------------

describe("getDaysUntilCycleEnd", () => {
  it("returns correct days for a normal case", () => {
    expect(getDaysUntilCycleEnd("2026-02-13", { start: "2026-01-25", end: "2026-02-25" })).toBe(12);
  });

  it("returns 1 on the day before end", () => {
    expect(getDaysUntilCycleEnd("2026-02-24", { start: "2026-01-25", end: "2026-02-25" })).toBe(1);
  });

  it("returns 0 on the end day (should not happen in practice)", () => {
    expect(getDaysUntilCycleEnd("2026-02-25", { start: "2026-01-25", end: "2026-02-25" })).toBe(0);
  });

  it("returns correct days for a yearly window", () => {
    expect(getDaysUntilCycleEnd("2026-02-13", { start: "2025-05-20", end: "2026-05-20" })).toBe(96);
  });
});

// ---------------------------------------------------------------------------
// isCycleExpiringSoon
// ---------------------------------------------------------------------------

describe("isCycleExpiringSoon", () => {
  it("returns true when within default threshold (7 days)", () => {
    expect(isCycleExpiringSoon(5)).toBe(true);
  });

  it("returns true when exactly at threshold", () => {
    expect(isCycleExpiringSoon(7)).toBe(true);
  });

  it("returns false when above threshold", () => {
    expect(isCycleExpiringSoon(8)).toBe(false);
  });

  it("returns false when 0 days (cycle already ended)", () => {
    expect(isCycleExpiringSoon(0)).toBe(false);
  });

  it("supports custom threshold", () => {
    expect(isCycleExpiringSoon(10, 14)).toBe(true);
    expect(isCycleExpiringSoon(15, 14)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// countRedemptionsInWindow
// ---------------------------------------------------------------------------

describe("countRedemptionsInWindow", () => {
  const window = { start: "2026-01-25", end: "2026-02-25" };

  it("counts redemptions inside the window", () => {
    const redemptions = [
      makeRedemption("b1", "2026-02-01"),
      makeRedemption("b1", "2026-02-10"),
    ];
    expect(countRedemptionsInWindow(redemptions, window)).toBe(2);
  });

  it("excludes redemptions before the window", () => {
    const redemptions = [
      makeRedemption("b1", "2026-01-20"),
      makeRedemption("b1", "2026-02-01"),
    ];
    expect(countRedemptionsInWindow(redemptions, window)).toBe(1);
  });

  it("excludes redemptions on/after the end date", () => {
    const redemptions = [
      makeRedemption("b1", "2026-02-01"),
      makeRedemption("b1", "2026-02-25"),
    ];
    expect(countRedemptionsInWindow(redemptions, window)).toBe(1);
  });

  it("includes redemptions on the start date (left-closed)", () => {
    const redemptions = [makeRedemption("b1", "2026-01-25")];
    expect(countRedemptionsInWindow(redemptions, window)).toBe(1);
  });

  it("returns 0 for empty array", () => {
    expect(countRedemptionsInWindow([], window)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeBenefitCycleStatus
// ---------------------------------------------------------------------------

describe("computeBenefitCycleStatus", () => {
  const sourceAnchor: CycleAnchor = { period: "monthly", anchor: 25 };

  describe("quota type", () => {
    it("available when no redemptions", () => {
      const benefit = makeBenefit({ type: "quota", quota: 6 });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-13");
      expect(info.status).toBe("available");
      expect(info.usedCount).toBe(0);
      expect(info.totalCount).toBe(6);
      expect(info.usageRatio).toBe(0);
    });

    it("partially_used when some redeemed", () => {
      const benefit = makeBenefit({ type: "quota", quota: 6 });
      const redemptions = [
        makeRedemption("b1", "2026-01-26"),
        makeRedemption("b1", "2026-02-05"),
        makeRedemption("b1", "2026-02-10"),
      ];
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, redemptions, "2026-02-13");
      expect(info.status).toBe("partially_used");
      expect(info.usedCount).toBe(3);
      expect(info.usageRatio).toBe(0.5);
    });

    it("exhausted when all redeemed", () => {
      const benefit = makeBenefit({ type: "quota", quota: 2 });
      const redemptions = [
        makeRedemption("b1", "2026-01-26"),
        makeRedemption("b1", "2026-02-05"),
      ];
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, redemptions, "2026-02-13");
      expect(info.status).toBe("exhausted");
      expect(info.usedCount).toBe(2);
      expect(info.usageRatio).toBe(1);
    });

    it("expiring_soon when within 7 days and still available", () => {
      const benefit = makeBenefit({ type: "quota", quota: 6 });
      const redemptions = [makeRedemption("b1", "2026-02-01")];
      // 2026-02-20 is 5 days before end (Feb 25)
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, redemptions, "2026-02-20");
      expect(info.status).toBe("expiring_soon");
      expect(info.isExpiringSoon).toBe(true);
    });

    it("exhausted even when expiring soon (no overlay)", () => {
      const benefit = makeBenefit({ type: "quota", quota: 1 });
      const redemptions = [makeRedemption("b1", "2026-02-01")];
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, redemptions, "2026-02-20");
      expect(info.status).toBe("exhausted");
    });
  });

  describe("credit type", () => {
    it("available when not redeemed", () => {
      const benefit = makeBenefit({ type: "credit", quota: null, creditAmount: 20 });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-13");
      expect(info.status).toBe("available");
      expect(info.totalCount).toBe(1);
      expect(info.usedCount).toBe(0);
    });

    it("exhausted when redeemed once", () => {
      const benefit = makeBenefit({ type: "credit", quota: null, creditAmount: 20 });
      const redemptions = [makeRedemption("b1", "2026-02-01")];
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, redemptions, "2026-02-13");
      expect(info.status).toBe("exhausted");
      expect(info.usedCount).toBe(1);
      expect(info.usageRatio).toBe(1);
    });

    it("expiring_soon when not redeemed and within 7 days", () => {
      const benefit = makeBenefit({ type: "credit", quota: null, creditAmount: 20 });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-20");
      expect(info.status).toBe("expiring_soon");
    });
  });

  describe("action type", () => {
    it("returns pending status", () => {
      const benefit = makeBenefit({ type: "action", quota: null, creditAmount: null });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-13");
      expect(info.status).toBe("pending");
      expect(info.totalCount).toBe(0);
      expect(info.usedCount).toBe(0);
    });
  });

  describe("benefit-level cycle anchor override", () => {
    it("uses benefit anchor when provided", () => {
      const benefit = makeBenefit({
        type: "quota",
        quota: 6,
        cycleAnchor: { period: "yearly", anchor: { month: 1, day: 1 } },
      });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-13");
      expect(info.window).toEqual({ start: "2026-01-01", end: "2027-01-01" });
    });
  });

  describe("cycle window correctness", () => {
    it("includes correct window in the result", () => {
      const benefit = makeBenefit({ type: "quota", quota: 6 });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-13");
      expect(info.window).toEqual({ start: "2026-01-25", end: "2026-02-25" });
    });

    it("computes daysUntilEnd correctly", () => {
      const benefit = makeBenefit({ type: "quota", quota: 6 });
      const info = computeBenefitCycleStatus(benefit, sourceAnchor, [], "2026-02-13");
      expect(info.daysUntilEnd).toBe(12);
    });
  });
});
