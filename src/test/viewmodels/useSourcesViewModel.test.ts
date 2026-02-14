import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { mockUseDatasetModule } from "./setup";

vi.mock("@/hooks/use-dataset", () => mockUseDatasetModule());

import { useSourcesViewModel } from "@/viewmodels/useSourcesViewModel";

describe("useSourcesViewModel", () => {
  // ---------------------------------------------------------------------------
  // stats
  // ---------------------------------------------------------------------------
  describe("stats", () => {
    it("returns 3 stat cards", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      expect(result.current.stats).toHaveLength(3);
    });

    it("each stat card has label and value", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      for (const card of result.current.stats) {
        expect(typeof card.label).toBe("string");
        expect(typeof card.value).toBe("number");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // sourceCards (active, non-archived)
  // ---------------------------------------------------------------------------
  describe("sourceCards", () => {
    it("does not include archived sources by default", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const ids = result.current.sourceCards.map((c) => c.id);
      expect(ids).not.toContain("s-icbc");
    });

    it("returns 6 active sources", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      // 7 total - 1 archived = 6
      expect(result.current.sourceCards).toHaveLength(6);
    });

    it("each card has icon info from resolveSourceIcon", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      for (const card of result.current.sourceCards) {
        expect(card.icon).toBeDefined();
        expect(["favicon", "icon", "category"]).toContain(card.icon.type);
        expect(typeof card.icon.value).toBe("string");
      }
    });

    it("cards include phone and validity fields", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      // 招行白金卡 has phone and validity dates
      const cmb = result.current.sourceCards.find((c) => c.id === "s-cmb");
      expect(cmb).toBeDefined();
      expect(cmb!.phone).toBe("95555");
      expect(cmb!.isExpired).toBe(false);
    });

    it("cards include memberName", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const cmb = result.current.sourceCards.find((c) => c.id === "s-cmb");
      expect(cmb!.memberName).toBe("爸爸");
    });
  });

  // ---------------------------------------------------------------------------
  // archivedSourceCards
  // ---------------------------------------------------------------------------
  describe("archivedSourceCards", () => {
    it("contains only archived sources", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      expect(result.current.archivedSourceCards).toHaveLength(1);
      expect(result.current.archivedSourceCards[0].id).toBe("s-icbc");
    });
  });

  // ---------------------------------------------------------------------------
  // member filter
  // ---------------------------------------------------------------------------
  describe("member filter", () => {
    it("members list includes all members plus a null (all) option", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      // Should contain option for each member
      expect(result.current.members.length).toBeGreaterThanOrEqual(3);
    });

    it("selectedMember starts as null (show all)", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      expect(result.current.selectedMember).toBeNull();
    });

    it("setting selectedMember filters sourceCards", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.setSelectedMember("m-mom");
      });
      // 妈妈 owns s-88vip and s-spdb (2 active sources)
      for (const card of result.current.sourceCards) {
        expect(card.memberId).toBe("m-mom");
      }
      expect(result.current.sourceCards.length).toBe(2);
    });

    it("setting selectedMember back to null shows all", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.setSelectedMember("m-mom");
      });
      act(() => {
        result.current.setSelectedMember(null);
      });
      expect(result.current.sourceCards).toHaveLength(6);
    });
  });

  // ---------------------------------------------------------------------------
  // pointsSourceCards
  // ---------------------------------------------------------------------------
  describe("pointsSourceCards", () => {
    it("returns points source cards", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      expect(result.current.pointsSourceCards.length).toBeGreaterThan(0);
    });

    it("each points card has balance and redeemableCount", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      for (const card of result.current.pointsSourceCards) {
        expect(typeof card.balance).toBe("number");
        expect(typeof card.redeemableCount).toBe("number");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CRUD: create source
  // ---------------------------------------------------------------------------
  describe("handleCreateSource", () => {
    it("adds a new source when input is valid", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const initialCount = result.current.sourceCards.length;
      act(() => {
        result.current.setFormInput({
          memberId: "m-dad",
          name: "新账户",
          category: "other",
          currency: "CNY",
          cycleAnchor: { period: "monthly", anchor: 1 },
        });
      });
      act(() => {
        result.current.setFormOpen(true);
      });
      act(() => {
        result.current.handleCreateSource();
      });
      expect(result.current.sourceCards.length).toBe(initialCount + 1);
      expect(result.current.formErrors).toHaveLength(0);
    });

    it("sets formErrors when input is invalid", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.setFormInput({
          memberId: "",
          name: "",
          category: "other",
          currency: "CNY",
          cycleAnchor: { period: "monthly", anchor: 1 },
        });
      });
      act(() => {
        result.current.handleCreateSource();
      });
      expect(result.current.formErrors.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // CRUD: update source
  // ---------------------------------------------------------------------------
  describe("handleUpdateSource", () => {
    it("updates an existing source", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.startEditSource("s-cmb");
      });
      // After startEdit, editingSource should be set
      expect(result.current.editingSource).not.toBeNull();
      act(() => {
        result.current.setFormInput({
          ...result.current.formInput,
          name: "招行白金-改名",
        });
      });
      act(() => {
        result.current.handleUpdateSource();
      });
      const updated = result.current.sourceCards.find((c) => c.id === "s-cmb");
      expect(updated!.name).toBe("招行白金-改名");
    });
  });

  // ---------------------------------------------------------------------------
  // CRUD: delete source
  // ---------------------------------------------------------------------------
  describe("handleDeleteSource", () => {
    it("removes a source from the list", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const initialCount = result.current.sourceCards.length;
      act(() => {
        result.current.handleDeleteSource("s-mobile");
      });
      expect(result.current.sourceCards.length).toBe(initialCount - 1);
      expect(result.current.sourceCards.find((c) => c.id === "s-mobile")).toBeUndefined();
    });

    it("cascade-deletes benefits and redemptions of the removed source", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const initialBenefitStat = result.current.stats.find(
        (s) => s.label === "活跃权益",
      )!.value;
      // s-mobile has 3 benefits in mock data
      act(() => {
        result.current.handleDeleteSource("s-mobile");
      });
      const afterBenefitStat = result.current.stats.find(
        (s) => s.label === "活跃权益",
      )!.value;
      expect(afterBenefitStat).toBeLessThan(initialBenefitStat);
    });
  });

  // ---------------------------------------------------------------------------
  // CRUD: toggle archive
  // ---------------------------------------------------------------------------
  describe("handleToggleArchive", () => {
    it("moves a source to archived list", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const initialActive = result.current.sourceCards.length;
      const initialArchived = result.current.archivedSourceCards.length;
      act(() => {
        result.current.handleToggleArchive("s-mobile");
      });
      expect(result.current.sourceCards.length).toBe(initialActive - 1);
      expect(result.current.archivedSourceCards.length).toBe(initialArchived + 1);
    });

    it("un-archives a source back to active list", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.handleToggleArchive("s-icbc");
      });
      expect(result.current.archivedSourceCards.length).toBe(0);
      const restored = result.current.sourceCards.find((c) => c.id === "s-icbc");
      expect(restored).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // formErrors with invalid website URL
  // ---------------------------------------------------------------------------
  describe("form validation", () => {
    it("reports error for invalid website URL format", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.setFormInput({
          memberId: "m-dad",
          name: "测试账户",
          category: "other",
          currency: "CNY",
          cycleAnchor: { period: "monthly", anchor: 1 },
          website: "not-a-url",
        });
      });
      act(() => {
        result.current.handleCreateSource();
      });
      expect(result.current.formErrors.some((e) => e.field === "website")).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Update validation error branch (lines 277-279)
  // ---------------------------------------------------------------------------
  describe("update validation", () => {
    it("sets formErrors when handleUpdateSource is called with invalid input", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      // Enter edit mode for an existing source
      act(() => {
        result.current.startEditSource("s-cmb");
      });
      expect(result.current.editingSource).not.toBeNull();
      // Set invalid input (empty name)
      act(() => {
        result.current.setFormInput({
          ...result.current.formInput,
          name: "",
        });
      });
      // Try updating — should fail validation and populate formErrors
      act(() => {
        result.current.handleUpdateSource();
      });
      expect(result.current.formErrors.length).toBeGreaterThan(0);
      expect(result.current.formErrors.some((e) => e.field === "name")).toBe(true);
      // Source should NOT have been modified
      const card = result.current.sourceCards.find((c) => c.id === "s-cmb");
      expect(card!.name).toBe("招商银行经典白金卡");
    });
  });

  // ---------------------------------------------------------------------------
  // Defensive guard branches
  // ---------------------------------------------------------------------------
  describe("defensive guards", () => {
    it("handleUpdateSource does nothing when editingId is null", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      const initialCards = result.current.sourceCards.length;
      // Call handleUpdateSource without entering edit mode
      act(() => {
        result.current.handleUpdateSource();
      });
      expect(result.current.sourceCards.length).toBe(initialCards);
    });

    it("startEditSource does nothing for nonexistent source ID", () => {
      const { result } = renderHook(() => useSourcesViewModel());
      act(() => {
        result.current.startEditSource("nonexistent-id");
      });
      expect(result.current.editingSource).toBeNull();
      expect(result.current.formOpen).toBe(false);
    });
  });
});
