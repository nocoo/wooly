import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePointsDetailViewModel } from "@/viewmodels/usePointsDetailViewModel";

describe("usePointsDetailViewModel", () => {
  // ---------------------------------------------------------------------------
  // header
  // ---------------------------------------------------------------------------
  describe("header", () => {
    it("returns null header for unknown id", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("nonexistent"),
      );
      expect(result.current.header).toBeNull();
    });

    it("returns header with correct fields for ps-cmb", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const h = result.current.header;
      expect(h).not.toBeNull();
      expect(h!.id).toBe("ps-cmb");
      expect(h!.name).toBe("招行永久积分");
      expect(h!.memberName).toBe("爸爸");
      expect(h!.balance).toBe(23500);
    });
  });

  // ---------------------------------------------------------------------------
  // redeemableRows
  // ---------------------------------------------------------------------------
  describe("redeemableRows", () => {
    it("returns redeemables for ps-cmb", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      expect(result.current.redeemableRows.length).toBeGreaterThan(0);
      for (const row of result.current.redeemableRows) {
        expect(row.pointsSourceId).toBe("ps-cmb");
        expect(typeof row.name).toBe("string");
        expect(typeof row.cost).toBe("number");
        expect(typeof row.affordable).toBe("boolean");
      }
    });

    it("marks affordable items correctly", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      // ps-cmb has balance 23500; 万豪 costs 20000 → affordable
      // All 4 items should be affordable (699, 1200, 5000, 20000 all <= 23500)
      const affordable = result.current.redeemableRows.filter(
        (r) => r.affordable,
      );
      expect(affordable.length).toBe(4);
    });

    it("returns empty redeemables for unknown id", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("nonexistent"),
      );
      expect(result.current.redeemableRows).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // stats
  // ---------------------------------------------------------------------------
  describe("stats", () => {
    it("returns 3 stat cards", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      expect(result.current.stats).toHaveLength(3);
    });

    it("stats include balance, total redeemables, affordable count", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const labels = result.current.stats.map((s) => s.label);
      expect(labels).toContain("积分余额");
      expect(labels).toContain("可兑换项");
      expect(labels).toContain("可负担项");
    });
  });

  // ---------------------------------------------------------------------------
  // Redeemable CRUD
  // ---------------------------------------------------------------------------
  describe("redeemable CRUD", () => {
    it("creates a new redeemable", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const initialCount = result.current.redeemableRows.length;

      act(() => {
        result.current.setRedeemableFormInput({
          pointsSourceId: "ps-cmb",
          name: "新兑换项",
          cost: 100,
        });
      });
      act(() => {
        result.current.handleCreateRedeemable();
      });

      expect(result.current.redeemableRows.length).toBe(initialCount + 1);
      expect(result.current.redeemableFormOpen).toBe(false);
    });

    it("validates redeemable input on create", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );

      act(() => {
        result.current.setRedeemableFormInput({
          pointsSourceId: "ps-cmb",
          name: "",
          cost: 0,
        });
      });
      act(() => {
        result.current.handleCreateRedeemable();
      });

      expect(result.current.redeemableFormErrors.length).toBeGreaterThan(0);
    });

    it("deletes a redeemable", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const initialCount = result.current.redeemableRows.length;
      const firstId = result.current.redeemableRows[0].id;

      act(() => {
        result.current.handleDeleteRedeemable(firstId);
      });

      expect(result.current.redeemableRows.length).toBe(initialCount - 1);
    });

    it("starts editing a redeemable", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const firstId = result.current.redeemableRows[0].id;

      act(() => {
        result.current.startEditRedeemable(firstId);
      });

      expect(result.current.editingRedeemableId).toBe(firstId);
      expect(result.current.redeemableFormOpen).toBe(true);
      expect(result.current.redeemableFormInput.name).toBeTruthy();
    });

    it("updates a redeemable", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const firstId = result.current.redeemableRows[0].id;

      act(() => {
        result.current.startEditRedeemable(firstId);
      });
      act(() => {
        result.current.setRedeemableFormInput({
          ...result.current.redeemableFormInput,
          name: "更新后的名称",
        });
      });
      act(() => {
        result.current.handleUpdateRedeemable();
      });

      const updated = result.current.redeemableRows.find(
        (r) => r.id === firstId,
      );
      expect(updated!.name).toBe("更新后的名称");
      expect(result.current.redeemableFormOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PointsSource update (balance edit)
  // ---------------------------------------------------------------------------
  describe("points source update", () => {
    it("updates the balance", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      expect(result.current.header!.balance).toBe(23500);

      act(() => {
        result.current.updateBalance(10000);
      });

      expect(result.current.header!.balance).toBe(10000);
    });

    it("affordable count changes when balance changes", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const initialAffordable = result.current.redeemableRows.filter(
        (r) => r.affordable,
      ).length;
      expect(initialAffordable).toBe(4);

      act(() => {
        // Set balance to 1000 — only 星巴克中杯拿铁 (699) is affordable
        result.current.updateBalance(1000);
      });

      const newAffordable = result.current.redeemableRows.filter(
        (r) => r.affordable,
      ).length;
      expect(newAffordable).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Update redeemable validation error branch (lines 186-188)
  // ---------------------------------------------------------------------------
  describe("update redeemable validation", () => {
    it("sets redeemableFormErrors when handleUpdateRedeemable is called with invalid input", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      // Get a redeemable to edit
      const firstRedeemable = result.current.redeemableRows[0];
      // Enter edit mode
      act(() => {
        result.current.startEditRedeemable(firstRedeemable.id);
      });
      expect(result.current.editingRedeemableId).toBe(firstRedeemable.id);
      // Set invalid input (empty name)
      act(() => {
        result.current.setRedeemableFormInput({
          ...result.current.redeemableFormInput,
          name: "",
        });
      });
      // Try updating — should fail validation and populate redeemableFormErrors
      act(() => {
        result.current.handleUpdateRedeemable();
      });
      expect(result.current.redeemableFormErrors.length).toBeGreaterThan(0);
      expect(
        result.current.redeemableFormErrors.some((e) => e.field === "name"),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Defensive guard branches
  // ---------------------------------------------------------------------------
  describe("defensive guards", () => {
    it("handleUpdateRedeemable does nothing when editingRedeemableId is null", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      const initialRows = result.current.redeemableRows.length;
      act(() => {
        result.current.handleUpdateRedeemable();
      });
      expect(result.current.redeemableRows.length).toBe(initialRows);
    });

    it("startEditRedeemable does nothing for nonexistent ID", () => {
      const { result } = renderHook(() =>
        usePointsDetailViewModel("ps-cmb"),
      );
      act(() => {
        result.current.startEditRedeemable("nonexistent-id");
      });
      expect(result.current.editingRedeemableId).toBeNull();
      expect(result.current.redeemableFormOpen).toBe(false);
    });
  });
});
