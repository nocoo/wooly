import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSourceDetailViewModel } from "@/viewmodels/useSourceDetailViewModel";

describe("useSourceDetailViewModel", () => {
  // ---------------------------------------------------------------------------
  // source header
  // ---------------------------------------------------------------------------
  describe("source header", () => {
    it("returns correct source when given valid sourceId", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(result.current.source).not.toBeNull();
      expect(result.current.source!.id).toBe("s-cmb");
      expect(result.current.source!.name).toBe("招商银行经典白金卡");
    });

    it("returns null source for unknown sourceId", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("nonexistent"));
      expect(result.current.source).toBeNull();
    });

    it("source header includes icon info", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(result.current.source!.icon).toBeDefined();
      expect(["favicon", "icon", "category"]).toContain(result.current.source!.icon.type);
    });

    it("source header includes memberName and categoryLabel", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(result.current.source!.memberName).toBe("爸爸");
      expect(result.current.source!.categoryLabel).toBe("信用卡");
    });

    it("source header includes phone", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(result.current.source!.phone).toBe("95555");
    });

    it("source header includes validity and expiry state", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(typeof result.current.source!.isExpired).toBe("boolean");
      expect(typeof result.current.source!.isExpiringSoon).toBe("boolean");
    });

    it("source header includes cycleLabel", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(typeof result.current.source!.cycleLabel).toBe("string");
      expect(result.current.source!.cycleLabel.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // stats
  // ---------------------------------------------------------------------------
  describe("stats", () => {
    it("returns 3 stat cards", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(result.current.stats).toHaveLength(3);
    });

    it("each stat card has label and value", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      for (const card of result.current.stats) {
        expect(typeof card.label).toBe("string");
        expect(typeof card.value).toBe("number");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // benefitRows
  // ---------------------------------------------------------------------------
  describe("benefitRows", () => {
    it("returns benefit rows for the source", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      // s-cmb has 8 benefits
      expect(result.current.benefitRows.length).toBe(8);
    });

    it("each row has status label and progress", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      for (const row of result.current.benefitRows) {
        expect(row).toHaveProperty("id");
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("type");
        expect(row).toHaveProperty("statusLabel");
        expect(row).toHaveProperty("statusColorClass");
        expect(row).toHaveProperty("progressPercent");
        expect(typeof row.progressPercent).toBe("number");
      }
    });

    it("action type benefits have special handling", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      const actionRow = result.current.benefitRows.find((r) => r.type === "action");
      if (actionRow) {
        // action type should have 0 progress (not applicable)
        expect(actionRow.progressPercent).toBe(0);
      }
    });

    it("returns empty benefitRows for unknown sourceId", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("nonexistent"));
      expect(result.current.benefitRows).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // memberUsage
  // ---------------------------------------------------------------------------
  describe("memberUsage", () => {
    it("returns member usage stats", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      expect(Array.isArray(result.current.memberUsage)).toBe(true);
    });

    it("each item has name and count", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      for (const item of result.current.memberUsage) {
        expect(typeof item.memberName).toBe("string");
        expect(typeof item.count).toBe("number");
        expect(item.count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // benefit CRUD
  // ---------------------------------------------------------------------------
  describe("benefit CRUD", () => {
    it("handleCreateBenefit adds a new benefit", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      const initialCount = result.current.benefitRows.length;
      act(() => {
        result.current.setBenefitFormInput({
          sourceId: "s-cmb",
          name: "新权益",
          type: "quota",
          quota: 5,
        });
      });
      act(() => {
        result.current.handleCreateBenefit();
      });
      expect(result.current.benefitRows.length).toBe(initialCount + 1);
    });

    it("handleCreateBenefit sets errors for invalid input", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      act(() => {
        result.current.setBenefitFormInput({
          sourceId: "s-cmb",
          name: "",
          type: "quota",
          quota: 5,
        });
      });
      act(() => {
        result.current.handleCreateBenefit();
      });
      expect(result.current.benefitFormErrors.length).toBeGreaterThan(0);
    });

    it("handleDeleteBenefit removes a benefit", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      const initialCount = result.current.benefitRows.length;
      const firstId = result.current.benefitRows[0].id;
      act(() => {
        result.current.handleDeleteBenefit(firstId);
      });
      expect(result.current.benefitRows.length).toBe(initialCount - 1);
    });

    it("startEditBenefit populates form with benefit data", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      act(() => {
        result.current.startEditBenefit("b-cmb-lounge");
      });
      expect(result.current.editingBenefitId).toBe("b-cmb-lounge");
      expect(result.current.benefitFormInput.name).toBe("机场贵宾厅");
    });

    it("handleUpdateBenefit modifies a benefit", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      act(() => {
        result.current.startEditBenefit("b-cmb-lounge");
      });
      act(() => {
        result.current.setBenefitFormInput({
          ...result.current.benefitFormInput,
          name: "贵宾厅-改名",
        });
      });
      act(() => {
        result.current.handleUpdateBenefit();
      });
      const updated = result.current.benefitRows.find((r) => r.id === "b-cmb-lounge");
      expect(updated!.name).toBe("贵宾厅-改名");
    });
  });

  // ---------------------------------------------------------------------------
  // redeem
  // ---------------------------------------------------------------------------
  describe("redeem", () => {
    it("creates a redemption and increases usage count", () => {
      const { result } = renderHook(() => useSourceDetailViewModel("s-cmb"));
      const lounge = result.current.benefitRows.find((r) => r.id === "b-cmb-lounge");
      const initialLabel = lounge!.statusLabel;
      act(() => {
        result.current.redeem("b-cmb-lounge", "m-dad");
      });
      const updated = result.current.benefitRows.find((r) => r.id === "b-cmb-lounge");
      // The status label should have changed (e.g. "3/6 次" -> "4/6 次")
      expect(updated!.statusLabel).not.toBe(initialLabel);
    });
  });
});
