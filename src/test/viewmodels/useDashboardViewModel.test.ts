import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { mockUseDatasetModule } from "./setup";

vi.mock("@/hooks/use-dataset", () => mockUseDatasetModule());

import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";

describe("useDashboardViewModel", () => {
  // ---------------------------------------------------------------------------
  // stats
  // ---------------------------------------------------------------------------
  describe("stats", () => {
    it("returns an array of 4 stat cards", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      expect(result.current.stats).toHaveLength(4);
    });

    it("each stat card has label and value", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      for (const card of result.current.stats) {
        expect(card).toHaveProperty("label");
        expect(card).toHaveProperty("value");
        expect(typeof card.label).toBe("string");
        expect(typeof card.value).toBe("number");
      }
    });

    it("stat values are non-negative integers", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      for (const card of result.current.stats) {
        expect(card.value).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(card.value)).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // expiringAlerts
  // ---------------------------------------------------------------------------
  describe("expiringAlerts", () => {
    it("returns an array of alert items", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      expect(Array.isArray(result.current.expiringAlerts)).toBe(true);
    });

    it("alerts are sorted by daysUntil ascending (most urgent first)", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      const alerts = result.current.expiringAlerts;
      for (let i = 1; i < alerts.length; i++) {
        expect(alerts[i].daysUntil).toBeGreaterThanOrEqual(alerts[i - 1].daysUntil);
      }
    });

    it("each alert has required fields", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      for (const alert of result.current.expiringAlerts) {
        expect(alert).toHaveProperty("id");
        expect(alert).toHaveProperty("label");
        expect(alert).toHaveProperty("sourceName");
        expect(alert).toHaveProperty("alertType");
        expect(alert).toHaveProperty("daysUntil");
        expect(alert).toHaveProperty("urgency");
        expect(["benefit_cycle", "source_validity"]).toContain(alert.alertType);
        expect(["urgent", "warning", "normal"]).toContain(alert.urgency);
      }
    });

    it("does not include alerts from archived sources", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      // The archived source is "工商银行白金卡" — its alerts should not appear
      for (const alert of result.current.expiringAlerts) {
        expect(alert.sourceName).not.toBe("工商银行白金卡");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // overallUsage
  // ---------------------------------------------------------------------------
  describe("overallUsage", () => {
    it("returns usedCount, totalCount, and percentage", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      const usage = result.current.overallUsage;
      expect(usage).toHaveProperty("usedCount");
      expect(usage).toHaveProperty("totalCount");
      expect(usage).toHaveProperty("percentage");
    });

    it("percentage is between 0 and 100", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      expect(result.current.overallUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(result.current.overallUsage.percentage).toBeLessThanOrEqual(100);
    });

    it("usedCount does not exceed totalCount", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      expect(result.current.overallUsage.usedCount).toBeLessThanOrEqual(
        result.current.overallUsage.totalCount,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // monthlyTrend
  // ---------------------------------------------------------------------------
  describe("monthlyTrend", () => {
    it("returns an array of monthly bars", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      expect(Array.isArray(result.current.monthlyTrend)).toBe(true);
      expect(result.current.monthlyTrend.length).toBeGreaterThan(0);
    });

    it("each bar has month (YYYY-MM format) and count", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      for (const bar of result.current.monthlyTrend) {
        expect(bar.month).toMatch(/^\d{4}-\d{2}$/);
        expect(typeof bar.count).toBe("number");
        expect(bar.count).toBeGreaterThanOrEqual(0);
      }
    });

    it("bars are in chronological order", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      const months = result.current.monthlyTrend.map((b) => b.month);
      const sorted = [...months].sort();
      expect(months).toEqual(sorted);
    });
  });

  // ---------------------------------------------------------------------------
  // topSources
  // ---------------------------------------------------------------------------
  describe("topSources", () => {
    it("returns an array of source summaries", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      expect(Array.isArray(result.current.topSources)).toBe(true);
    });

    it("each summary has sourceId, sourceName, usedCount, totalCount", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      for (const s of result.current.topSources) {
        expect(s).toHaveProperty("sourceId");
        expect(s).toHaveProperty("sourceName");
        expect(s).toHaveProperty("usedCount");
        expect(s).toHaveProperty("totalCount");
      }
    });

    it("does not include the archived source", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      for (const s of result.current.topSources) {
        expect(s.sourceId).not.toBe("s-icbc");
      }
    });
  });
});
