// Loading-state coverage: each ViewModel has a `loading || !dataset` early
// return that yields skeleton results until the async dataset hook resolves.
// This file exercises that branch + the `?? []` defaults that fire when the
// dataset is unavailable.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const noopSync = vi.fn();
const useDatasetMock = vi.fn();

vi.mock("@/hooks/use-dataset", () => ({
  useDataset: () => useDatasetMock(),
}));

beforeEach(() => {
  useDatasetMock.mockReset();
  useDatasetMock.mockReturnValue({
    dataset: null,
    loading: true,
    error: null,
    scheduleSync: noopSync,
  });
});

describe("ViewModel loading-state branches", () => {
  it("useDashboardViewModel returns EMPTY_RESULT when loading", async () => {
    const { useDashboardViewModel } = await import(
      "@/viewmodels/useDashboardViewModel"
    );
    const { result } = renderHook(() => useDashboardViewModel());
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toEqual([]);
    expect(result.current.expiringAlerts).toEqual([]);
    expect(result.current.monthlyTrend).toEqual([]);
    expect(result.current.topSources).toEqual([]);
    expect(result.current.overallUsage).toEqual({
      usedCount: 0,
      totalCount: 0,
      percentage: 0,
    });
  });

  it("usePointsDetailViewModel returns loading skeleton when loading", async () => {
    const { usePointsDetailViewModel } = await import(
      "@/viewmodels/usePointsDetailViewModel"
    );
    const { result } = renderHook(() => usePointsDetailViewModel("ps-cmb"));
    expect(result.current.loading).toBe(true);
    expect(result.current.header).toBeNull();
    expect(result.current.stats).toEqual([]);
    expect(result.current.redeemableRows).toEqual([]);
  });

  it("usePointsDetailViewModel doSync uses defaults when datasetRef is null", async () => {
    const { usePointsDetailViewModel } = await import(
      "@/viewmodels/usePointsDetailViewModel"
    );
    const { result } = renderHook(() => usePointsDetailViewModel("ps-cmb"));
    // Trigger a callback that calls doSync while datasetRef is null
    noopSync.mockClear();
    act(() => {
      result.current.handleDeleteRedeemable("does-not-matter");
    });
    expect(noopSync).toHaveBeenCalled();
    const payload = noopSync.mock.calls[0][0]();
    expect(payload.members).toEqual([]);
    expect(payload.sources).toEqual([]);
    expect(payload.benefits).toEqual([]);
    expect(payload.redemptions).toEqual([]);
    expect(payload.defaultSettings).toEqual({ timezone: "Asia/Shanghai" });
  });

  it("useSettingsViewModel returns loading skeleton when loading", async () => {
    const { useSettingsViewModel } = await import(
      "@/viewmodels/useSettingsViewModel"
    );
    const { result } = renderHook(() => useSettingsViewModel());
    expect(result.current.loading).toBe(true);
    expect(result.current.members).toEqual([]);
    expect(result.current.timezone).toBe("Asia/Shanghai");
  });

  it("useSettingsViewModel doSync uses defaults when datasetRef is null", async () => {
    const { useSettingsViewModel } = await import(
      "@/viewmodels/useSettingsViewModel"
    );
    const { result } = renderHook(() => useSettingsViewModel());
    noopSync.mockClear();
    act(() => {
      result.current.handleDeleteMember("anything");
    });
    expect(noopSync).toHaveBeenCalled();
    const payload = noopSync.mock.calls[0][0]();
    expect(payload.sources).toEqual([]);
    expect(payload.benefits).toEqual([]);
    expect(payload.redemptions).toEqual([]);
    expect(payload.pointsSources).toEqual([]);
    expect(payload.redeemables).toEqual([]);
  });

  it("useSourceDetailViewModel returns loading skeleton when loading", async () => {
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-anything"));
    expect(result.current.loading).toBe(true);
    expect(result.current.source).toBeNull();
    expect(result.current.stats).toEqual([]);
    expect(result.current.benefitRows).toEqual([]);
    expect(result.current.memberUsage).toEqual([]);
  });

  it("useSourceDetailViewModel doSync uses defaults when datasetRef is null", async () => {
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-anything"));
    noopSync.mockClear();
    act(() => {
      result.current.handleDeleteBenefit("anything");
    });
    expect(noopSync).toHaveBeenCalled();
    const payload = noopSync.mock.calls[0][0]();
    expect(payload.members).toEqual([]);
    expect(payload.sources).toEqual([]);
    expect(payload.pointsSources).toEqual([]);
    expect(payload.redeemables).toEqual([]);
    expect(payload.defaultSettings).toEqual({ timezone: "Asia/Shanghai" });
  });

  it("useSourcesViewModel returns loading skeleton when loading", async () => {
    const { useSourcesViewModel } = await import(
      "@/viewmodels/useSourcesViewModel"
    );
    const { result } = renderHook(() => useSourcesViewModel());
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toEqual([]);
    expect(result.current.members).toEqual([]);
    expect(result.current.sourceCards).toEqual([]);
    expect(result.current.archivedSourceCards).toEqual([]);
    expect(result.current.pointsSourceCards).toEqual([]);
    expect(result.current.editingSource).toBeNull();
  });

  it("useSourcesViewModel doSync uses defaults when datasetRef is null", async () => {
    const { useSourcesViewModel } = await import(
      "@/viewmodels/useSourcesViewModel"
    );
    const { result } = renderHook(() => useSourcesViewModel());
    noopSync.mockClear();
    act(() => {
      result.current.handleToggleArchive("anything");
    });
    expect(noopSync).toHaveBeenCalled();
    const payload = noopSync.mock.calls[0][0]();
    expect(payload.members).toEqual([]);
    expect(payload.pointsSources).toEqual([]);
    expect(payload.redeemables).toEqual([]);
    expect(payload.defaultSettings).toEqual({ timezone: "Asia/Shanghai" });
  });

  it("useTrackerViewModel returns loading skeleton when loading", async () => {
    const { useTrackerViewModel } = await import(
      "@/viewmodels/useTrackerViewModel"
    );
    const { result } = renderHook(() => useTrackerViewModel());
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toEqual([]);
    expect(result.current.recentRedemptions).toEqual([]);
    expect(result.current.redeemableBenefits).toEqual([]);
    expect(result.current.members).toEqual([]);
  });

  it("useTrackerViewModel doSync uses defaults when datasetRef is null", async () => {
    const { useTrackerViewModel } = await import(
      "@/viewmodels/useTrackerViewModel"
    );
    const { result } = renderHook(() => useTrackerViewModel());
    noopSync.mockClear();
    act(() => {
      result.current.undoRedemption("anything");
    });
    expect(noopSync).toHaveBeenCalled();
    const payload = noopSync.mock.calls[0][0]();
    expect(payload.members).toEqual([]);
    expect(payload.sources).toEqual([]);
    expect(payload.benefits).toEqual([]);
    expect(payload.pointsSources).toEqual([]);
    expect(payload.redeemables).toEqual([]);
    expect(payload.defaultSettings).toEqual({ timezone: "Asia/Shanghai" });
  });
});
