import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { mockUseDatasetModule } from "./setup";

vi.mock("@/hooks/use-dataset", () => mockUseDatasetModule());

import { useTrackerViewModel } from "@/viewmodels/useTrackerViewModel";

describe("useTrackerViewModel", () => {
  // ---------------------------------------------------------------------------
  // stats
  // ---------------------------------------------------------------------------
  describe("stats", () => {
    it("returns 3 stat cards", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      expect(result.current.stats).toHaveLength(3);
    });

    it("stat cards have labels: 今日核销, 本周核销, 本月核销", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const labels = result.current.stats.map((s) => s.label);
      expect(labels).toEqual(["今日核销", "本周核销", "本月核销"]);
    });

    it("each stat card has a numeric value", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      for (const card of result.current.stats) {
        expect(typeof card.value).toBe("number");
        expect(card.value).toBeGreaterThanOrEqual(0);
      }
    });

    it("today count is less than or equal to this week count", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const [today, week] = result.current.stats;
      expect(today.value).toBeLessThanOrEqual(week.value);
    });

    it("this week count is less than or equal to this month count", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const [, week, month] = result.current.stats;
      expect(week.value).toBeLessThanOrEqual(month.value);
    });
  });

  // ---------------------------------------------------------------------------
  // recentRedemptions
  // ---------------------------------------------------------------------------
  describe("recentRedemptions", () => {
    it("returns an array of recent redemptions", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      expect(Array.isArray(result.current.recentRedemptions)).toBe(true);
      expect(result.current.recentRedemptions.length).toBeGreaterThan(0);
    });

    it("redemptions are sorted in reverse chronological order", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const dates = result.current.recentRedemptions.map((r) => r.redeemedAt);
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] >= dates[i]).toBe(true);
      }
    });

    it("each item has enriched display fields", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const first = result.current.recentRedemptions[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("benefitName");
      expect(first).toHaveProperty("sourceName");
      expect(first).toHaveProperty("memberName");
      expect(first).toHaveProperty("redeemedAt");
      expect(typeof first.benefitName).toBe("string");
      expect(typeof first.sourceName).toBe("string");
      expect(typeof first.memberName).toBe("string");
    });

    it("includes memo when available", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // r-01 has memo "昨天出差使用"
      const withMemo = result.current.recentRedemptions.find(
        (r) => r.memo !== null && r.memo !== undefined,
      );
      expect(withMemo).toBeDefined();
      expect(typeof withMemo!.memo).toBe("string");
    });

    it("includes redemptions from all non-archived sources", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // Mock data has 20 redemptions, all from non-archived sources
      // (s-icbc is archived but has no redemptions in mock data)
      expect(result.current.recentRedemptions.length).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // redeemableBenefits
  // ---------------------------------------------------------------------------
  describe("redeemableBenefits", () => {
    it("returns an array of redeemable benefits", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      expect(Array.isArray(result.current.redeemableBenefits)).toBe(true);
      expect(result.current.redeemableBenefits.length).toBeGreaterThan(0);
    });

    it("excludes action type benefits", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // action benefits: b-cmb-spend, b-pingan-hospital, b-88vip-marriott,
      // b-mobile-topup, b-spdb-delay — none should appear
      const actionIds = [
        "b-cmb-spend",
        "b-pingan-hospital",
        "b-88vip-marriott",
        "b-mobile-topup",
        "b-spdb-delay",
      ];
      for (const item of result.current.redeemableBenefits) {
        expect(actionIds).not.toContain(item.id);
      }
    });

    it("excludes benefits from archived sources", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // s-icbc is archived; its benefits b-icbc-lounge, b-icbc-cashback
      const archivedBenefitIds = ["b-icbc-lounge", "b-icbc-cashback"];
      for (const item of result.current.redeemableBenefits) {
        expect(archivedBenefitIds).not.toContain(item.id);
      }
    });

    it("each item has display fields for the benefit list", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const first = result.current.redeemableBenefits[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("benefitName");
      expect(first).toHaveProperty("sourceName");
      expect(first).toHaveProperty("type");
      expect(first).toHaveProperty("statusLabel");
      expect(first).toHaveProperty("progressPercent");
      expect(first).toHaveProperty("daysUntilEnd");
    });

    it("excludes exhausted quota benefits", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // All redeemable benefits should not have status "exhausted"
      // (check that progress is less than 100% for quota types, or not already used for credit)
      for (const item of result.current.redeemableBenefits) {
        if (item.type === "quota") {
          expect(item.isExhausted).toBe(false);
        }
      }
    });

    it("excludes exhausted credit benefits", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      for (const item of result.current.redeemableBenefits) {
        if (item.type === "credit") {
          expect(item.isExhausted).toBe(false);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // redeem
  // ---------------------------------------------------------------------------
  describe("redeem", () => {
    it("adds a new redemption to recentRedemptions", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const initialCount = result.current.recentRedemptions.length;
      act(() => {
        result.current.redeem("b-cmb-hotel", "m-dad");
      });
      expect(result.current.recentRedemptions.length).toBe(initialCount + 1);
    });

    it("new redemption appears at the top (most recent)", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      act(() => {
        result.current.redeem("b-cmb-hotel", "m-dad", "测试核销");
      });
      const latest = result.current.recentRedemptions[0];
      expect(latest.benefitName).toBe("酒店权益");
      expect(latest.memberName).toBe("爸爸");
      expect(latest.memo).toBe("测试核销");
    });

    it("updates stats after redeem", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const todayBefore = result.current.stats[0].value;
      act(() => {
        result.current.redeem("b-cmb-hotel", "m-dad");
      });
      // Today's count should increase by 1
      expect(result.current.stats[0].value).toBe(todayBefore + 1);
    });

    it("updates redeemableBenefits status after redeem", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // b-cmb-hotel is credit type with creditAmount 300, should be exhausted after redeem
      const before = result.current.redeemableBenefits.find(
        (b) => b.id === "b-cmb-hotel",
      );
      expect(before).toBeDefined();
      act(() => {
        result.current.redeem("b-cmb-hotel", "m-dad");
      });
      // After redeem, credit benefit should be exhausted and removed from list
      const after = result.current.redeemableBenefits.find(
        (b) => b.id === "b-cmb-hotel",
      );
      expect(after).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // undoRedemption
  // ---------------------------------------------------------------------------
  describe("undoRedemption", () => {
    it("removes a redemption from recentRedemptions", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      const initialCount = result.current.recentRedemptions.length;
      const firstId = result.current.recentRedemptions[0].id;
      act(() => {
        result.current.undoRedemption(firstId);
      });
      expect(result.current.recentRedemptions.length).toBe(initialCount - 1);
      const found = result.current.recentRedemptions.find((r) => r.id === firstId);
      expect(found).toBeUndefined();
    });

    it("updates stats after undo", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // First add a redemption so we have one today
      act(() => {
        result.current.redeem("b-cmb-hotel", "m-dad");
      });
      const todayAfterRedeem = result.current.stats[0].value;
      const latestId = result.current.recentRedemptions[0].id;
      act(() => {
        result.current.undoRedemption(latestId);
      });
      expect(result.current.stats[0].value).toBe(todayAfterRedeem - 1);
    });

    it("restores exhausted benefit back to redeemable after undo", () => {
      const { result } = renderHook(() => useTrackerViewModel());
      // Redeem b-cmb-hotel (credit) -> becomes exhausted -> removed from redeemable
      act(() => {
        result.current.redeem("b-cmb-hotel", "m-dad");
      });
      expect(
        result.current.redeemableBenefits.find((b) => b.id === "b-cmb-hotel"),
      ).toBeUndefined();

      // Undo it -> should reappear
      const redemptionId = result.current.recentRedemptions.find(
        (r) => r.benefitName === "酒店权益" && r.memberName === "爸爸",
      )!.id;
      act(() => {
        result.current.undoRedemption(redemptionId);
      });
      expect(
        result.current.redeemableBenefits.find((b) => b.id === "b-cmb-hotel"),
      ).toBeDefined();
    });
  });
});
