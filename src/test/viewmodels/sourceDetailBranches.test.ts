// Branch coverage: exercise the rarely-hit conditional branches in
// useSourceDetailViewModel — expired sources, missing website, missing member,
// credit-type benefits, exhausted/expiring statuses — using the mock dataset's
// non-cmb sources and a custom dataset for the website-null branch.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { getDataset } from "@/data/datasets";
import type { Dataset } from "@/data/datasets";

const noopSync = vi.fn();
const useDatasetMock = vi.fn();

vi.mock("@/hooks/use-dataset", () => ({
  useDataset: () => useDatasetMock(),
}));

function setDataset(dataset: Dataset) {
  useDatasetMock.mockReturnValue({
    dataset,
    loading: false,
    error: null,
    scheduleSync: noopSync,
  });
}

beforeEach(() => {
  useDatasetMock.mockReset();
  setDataset(getDataset());
});

describe("useSourceDetailViewModel branch variants", () => {
  it("s-spdb (validUntil 2026-03-01) is marked expired with warning", async () => {
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-spdb"));
    expect(result.current.source).not.toBeNull();
    expect(result.current.source!.isExpired).toBe(true);
    expect(result.current.source!.expiryWarning).toBe("已过期");
  });

  it("s-mobile (no validUntil) reports no expiry warning", async () => {
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-mobile"));
    expect(result.current.source).not.toBeNull();
    expect(result.current.source!.validUntilLabel).toBeNull();
    expect(result.current.source!.expiryWarning).toBeNull();
  });

  it("source with no website yields null websiteDomain and unknown member falls back", async () => {
    // Custom dataset: source with website=null and unknown memberId, plus a
    // credit-type benefit so the credit branch in benefitRows is exercised.
    const base = getDataset();
    const custom: Dataset = {
      ...base,
      sources: [
        {
          ...base.sources[0],
          id: "s-custom",
          memberId: "m-ghost", // not in members
          website: null,
          category: "unknown-cat" as never,
          validUntil: null,
          validFrom: null,
        },
      ],
      benefits: [
        {
          ...base.benefits[0],
          id: "b-c-credit",
          sourceId: "s-custom",
          type: "credit",
          quota: null,
          creditAmount: 100,
        },
      ],
      redemptions: [],
    };
    setDataset(custom);
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-custom"));
    expect(result.current.source!.websiteDomain).toBeNull();
    expect(result.current.source!.memberName).toBe("未知");
    // Unknown category falls back to raw value
    expect(result.current.source!.categoryLabel).toBe("unknown-cat");
    // overallUsagePercent has no quota benefits → 0 (countTotal === 0 branch)
    expect(result.current.source!.overallUsagePercent).toBe(0);
    // credit-type unused → "未使用"
    const creditRow = result.current.benefitRows.find(
      (r) => r.id === "b-c-credit",
    );
    expect(creditRow!.statusLabel).toBe("未使用");
    expect(creditRow!.progressPercent).toBe(0);
  });

  it("memberUsage falls back to '未知' when redemption member is unknown", async () => {
    const base = getDataset();
    const custom: Dataset = {
      ...base,
      sources: [{ ...base.sources[0], id: "s-x" }],
      benefits: [{ ...base.benefits[0], id: "b-x", sourceId: "s-x" }],
      redemptions: [
        {
          id: "r-x",
          benefitId: "b-x",
          memberId: "m-ghost",
          redeemedAt: "2026-04-01",
          memo: null,
        },
      ],
    };
    setDataset(custom);
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-x"));
    const ghost = result.current.memberUsage.find(
      (u) => u.memberId === "m-ghost",
    );
    expect(ghost!.memberName).toBe("未知");
  });

  it("exhausted quota benefit reports exhausted status and triggers stat counters", async () => {
    const base = getDataset();
    const custom: Dataset = {
      ...base,
      sources: [
        {
          ...base.sources[0],
          id: "s-exh",
          cycleAnchor: { period: "yearly", anchor: { month: 1, day: 1 } },
        },
      ],
      benefits: [
        {
          ...base.benefits[0],
          id: "b-exh",
          sourceId: "s-exh",
          type: "quota",
          quota: 1,
          cycleAnchor: null,
        },
      ],
      redemptions: [
        {
          id: "r-exh",
          benefitId: "b-exh",
          memberId: "m-dad",
          redeemedAt: "2026-02-01",
          memo: null,
        },
      ],
    };
    setDataset(custom);
    const { useSourceDetailViewModel } = await import(
      "@/viewmodels/useSourceDetailViewModel"
    );
    const { result } = renderHook(() => useSourceDetailViewModel("s-exh"));
    const exhaustedStat = result.current.stats.find(
      (s) => s.label === "已用完",
    );
    expect(exhaustedStat!.value).toBe(1);
  });
});
