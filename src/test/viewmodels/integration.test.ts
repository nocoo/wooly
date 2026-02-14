import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { mockUseDatasetModule } from "./setup";

vi.mock("@/hooks/use-dataset", () => mockUseDatasetModule());

import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import { useSourcesViewModel } from "@/viewmodels/useSourcesViewModel";
import { useTrackerViewModel } from "@/viewmodels/useTrackerViewModel";
import { usePointsDetailViewModel } from "@/viewmodels/usePointsDetailViewModel";
import {
  sources as mockSources,
  benefits as mockBenefits,
  pointsSources as mockPointsSources,
  redeemables as mockRedeemables,
} from "@/data/mock";

/**
 * Integration-level tests that verify cross-ViewModel consistency.
 * These ensure that the same mock data produces coherent results
 * across Dashboard, Sources, and Tracker views.
 */
describe("cross-ViewModel integration", () => {
  // ---------------------------------------------------------------------------
  // Source count consistency
  // ---------------------------------------------------------------------------
  describe("source count consistency", () => {
    it("Sources '总来源数' stat matches active source card count", () => {
      const { result } = renderHook(() => useSourcesViewModel());

      const totalSourceStat = result.current.stats.find(
        (s) => s.label === "总来源数",
      );
      const sourcesActiveCount = result.current.sourceCards.length;

      expect(totalSourceStat).toBeDefined();
      expect(totalSourceStat!.value).toBe(sourcesActiveCount);
    });

    it("Sources archived count matches mock data archived count", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const archivedInMock = mockSources.filter((s) => s.archived).length;
      expect(result.current.archivedSourceCards).toHaveLength(archivedInMock);
    });

    it("Sources active + archived = total mock sources", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const totalCards =
        result.current.sourceCards.length +
        result.current.archivedSourceCards.length;
      expect(totalCards).toBe(mockSources.length);
    });
  });

  // ---------------------------------------------------------------------------
  // Benefit count consistency
  // ---------------------------------------------------------------------------
  describe("benefit count consistency", () => {
    it("Dashboard '总权益数' matches Sources '活跃权益' stat", () => {
      const { result: dashResult } = renderHook(() => useDashboardViewModel());
      const { result: srcResult } = renderHook(() => useSourcesViewModel());

      // Dashboard "总权益数" and Sources "活跃权益" should both equal active benefits count
      const dashBenefitStat = dashResult.current.stats.find(
        (s) => s.label === "总权益数",
      );
      const srcBenefitStat = srcResult.current.stats.find(
        (s) => s.label === "活跃权益",
      );

      expect(dashBenefitStat).toBeDefined();
      expect(srcBenefitStat).toBeDefined();
      expect(dashBenefitStat!.value).toBe(srcBenefitStat!.value);
    });

    it("active benefits exclude benefits from archived sources", () => {
      const archivedSourceIds = new Set(
        mockSources.filter((s) => s.archived).map((s) => s.id),
      );
      const activeBenefitCount = mockBenefits.filter(
        (b) => !archivedSourceIds.has(b.sourceId),
      ).length;

      const { result } = renderHook(() => useSourcesViewModel());
      const srcBenefitStat = result.current.stats.find(
        (s) => s.label === "活跃权益",
      );
      expect(srcBenefitStat!.value).toBe(activeBenefitCount);
    });
  });

  // ---------------------------------------------------------------------------
  // Archive exclusion across all ViewModels
  // ---------------------------------------------------------------------------
  describe("archive exclusion across ViewModels", () => {
    const archivedSourceIds = mockSources
      .filter((s) => s.archived)
      .map((s) => s.id);
    const archivedBenefitIds = mockBenefits
      .filter((b) => archivedSourceIds.includes(b.sourceId))
      .map((b) => b.id);

    it("Dashboard topSources excludes all archived source IDs", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      const topIds = result.current.topSources.map((s) => s.sourceId);
      for (const id of archivedSourceIds) {
        expect(topIds).not.toContain(id);
      }
    });

    it("Dashboard expiringAlerts excludes all archived sources", () => {
      const { result } = renderHook(() => useDashboardViewModel());
      // Alerts may include sourceName or benefitId — check both
      for (const alert of result.current.expiringAlerts) {
        expect(archivedSourceIds).not.toContain(alert.sourceId);
      }
    });

    it("Tracker redeemableBenefits excludes all archived-source benefits", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      for (const item of result.current.redeemableBenefits) {
        expect(archivedBenefitIds).not.toContain(item.id);
        expect(archivedSourceIds).not.toContain(item.sourceId);
      }
    });

    it("Sources sourceCards excludes all archived source IDs", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const activeIds = result.current.sourceCards.map((c) => c.id);
      for (const id of archivedSourceIds) {
        expect(activeIds).not.toContain(id);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Points source consistency
  // ---------------------------------------------------------------------------
  describe("points source consistency", () => {
    it("Sources page points card count matches mock data", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      expect(result.current.pointsSourceCards).toHaveLength(
        mockPointsSources.length,
      );
    });

    it("Sources stat for points matches PointsSource count", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const pointsStat = result.current.stats.find(
        (s) => s.label === "积分来源",
      );
      expect(pointsStat).toBeDefined();
      expect(pointsStat!.value).toBe(mockPointsSources.length);
    });

    it("PointsDetail redeemable count matches mock data per source", () => {
      for (const ps of mockPointsSources) {
        const { result } = renderHook(() =>
          usePointsDetailViewModel(ps.id),
        );
        const mockCount = mockRedeemables.filter(
          (r) => r.pointsSourceId === ps.id,
        ).length;
        expect(result.current.redeemableRows).toHaveLength(mockCount);
      }
    });

    it("PointsDetail balance matches Sources card balance", () => {
      const { result: srcResult } = renderHook(() => useSourcesViewModel());
      for (const ps of mockPointsSources) {
        const { result: ptResult } = renderHook(() =>
          usePointsDetailViewModel(ps.id),
        );
        const srcCard = srcResult.current.pointsSourceCards.find(
          (c) => c.id === ps.id,
        );
        expect(srcCard).toBeDefined();
        expect(ptResult.current.header!.balance).toBe(srcCard!.balance);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Tracker action-type exclusion
  // ---------------------------------------------------------------------------
  describe("tracker action-type exclusion", () => {
    it("Tracker never shows action-type benefits in redeemable list", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const actionBenefitIds = mockBenefits
        .filter((b) => b.type === "action")
        .map((b) => b.id);
      for (const item of result.current.redeemableBenefits) {
        expect(actionBenefitIds).not.toContain(item.id);
      }
    });
  });
});
