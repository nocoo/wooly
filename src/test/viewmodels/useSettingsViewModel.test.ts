import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsViewModel } from "@/viewmodels/useSettingsViewModel";

describe("useSettingsViewModel", () => {
  // ---------------------------------------------------------------------------
  // members list
  // ---------------------------------------------------------------------------
  describe("members list", () => {
    it("returns the initial members list with relationship labels", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      expect(result.current.members.length).toBe(3);
    });

    it("each member has name, relationship, and relationshipLabel", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      for (const m of result.current.members) {
        expect(m).toHaveProperty("id");
        expect(m).toHaveProperty("name");
        expect(m).toHaveProperty("relationship");
        expect(m).toHaveProperty("relationshipLabel");
        expect(typeof m.relationshipLabel).toBe("string");
        expect(m.relationshipLabel.length).toBeGreaterThan(0);
      }
    });

    it("relationship labels are correct Chinese text", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const dad = result.current.members.find((m) => m.name === "爸爸");
      expect(dad!.relationshipLabel).toBe("本人");
      const mom = result.current.members.find((m) => m.name === "妈妈");
      expect(mom!.relationshipLabel).toBe("配偶");
      const grandma = result.current.members.find((m) => m.name === "奶奶");
      expect(grandma!.relationshipLabel).toBe("父母");
    });

    it("each member has sourceCount showing associated sources", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const dad = result.current.members.find((m) => m.name === "爸爸");
      // 爸爸 has sources: s-cmb, s-pingan, s-jd, s-mobile, s-icbc = 5
      expect(dad!.sourceCount).toBe(5);
      const mom = result.current.members.find((m) => m.name === "妈妈");
      // 妈妈 has sources: s-88vip, s-spdb = 2
      expect(mom!.sourceCount).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // member CRUD
  // ---------------------------------------------------------------------------
  describe("member CRUD", () => {
    it("handleCreateMember adds a new member", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const initialCount = result.current.members.length;
      act(() => {
        result.current.setMemberFormInput({
          name: "小明",
          relationship: "child",
        });
      });
      act(() => {
        result.current.handleCreateMember();
      });
      expect(result.current.members.length).toBe(initialCount + 1);
      const added = result.current.members.find((m) => m.name === "小明");
      expect(added).toBeDefined();
      expect(added!.relationshipLabel).toBe("子女");
    });

    it("handleCreateMember closes form and resets input on success", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      act(() => {
        result.current.setMemberFormOpen(true);
      });
      act(() => {
        result.current.setMemberFormInput({
          name: "小红",
          relationship: "sibling",
        });
      });
      act(() => {
        result.current.handleCreateMember();
      });
      expect(result.current.memberFormOpen).toBe(false);
      expect(result.current.memberFormErrors).toHaveLength(0);
    });

    it("handleDeleteMember removes a member", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      // Add a member first with no dependents
      act(() => {
        result.current.setMemberFormInput({
          name: "临时成员",
          relationship: "other",
        });
      });
      act(() => {
        result.current.handleCreateMember();
      });
      const added = result.current.members.find((m) => m.name === "临时成员");
      expect(added).toBeDefined();
      const countBefore = result.current.members.length;
      act(() => {
        result.current.handleDeleteMember(added!.id);
      });
      expect(result.current.members.length).toBe(countBefore - 1);
    });

    it("startEditMember populates form with member data", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const dad = result.current.members.find((m) => m.name === "爸爸");
      act(() => {
        result.current.startEditMember(dad!.id);
      });
      expect(result.current.editingMemberId).toBe(dad!.id);
      expect(result.current.memberFormInput.name).toBe("爸爸");
      expect(result.current.memberFormInput.relationship).toBe("self");
      expect(result.current.memberFormOpen).toBe(true);
    });

    it("handleUpdateMember modifies a member", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const dad = result.current.members.find((m) => m.name === "爸爸");
      act(() => {
        result.current.startEditMember(dad!.id);
      });
      act(() => {
        result.current.setMemberFormInput({
          ...result.current.memberFormInput,
          name: "老爸",
        });
      });
      act(() => {
        result.current.handleUpdateMember();
      });
      const updated = result.current.members.find((m) => m.id === dad!.id);
      expect(updated!.name).toBe("老爸");
    });
  });

  // ---------------------------------------------------------------------------
  // memberFormErrors
  // ---------------------------------------------------------------------------
  describe("memberFormErrors", () => {
    it("sets errors when name is empty", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      act(() => {
        result.current.setMemberFormInput({
          name: "",
          relationship: "child",
        });
      });
      act(() => {
        result.current.handleCreateMember();
      });
      expect(result.current.memberFormErrors.length).toBeGreaterThan(0);
      const nameError = result.current.memberFormErrors.find(
        (e) => e.field === "name",
      );
      expect(nameError).toBeDefined();
    });

    it("sets errors when name is duplicate", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      act(() => {
        result.current.setMemberFormInput({
          name: "爸爸", // already exists
          relationship: "other",
        });
      });
      act(() => {
        result.current.handleCreateMember();
      });
      expect(result.current.memberFormErrors.length).toBeGreaterThan(0);
    });

    it("does not add member when validation fails", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const initialCount = result.current.members.length;
      act(() => {
        result.current.setMemberFormInput({
          name: "",
          relationship: "child",
        });
      });
      act(() => {
        result.current.handleCreateMember();
      });
      expect(result.current.members.length).toBe(initialCount);
    });
  });

  // ---------------------------------------------------------------------------
  // memberDependents
  // ---------------------------------------------------------------------------
  describe("memberDependents", () => {
    it("returns null when no member is being checked", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      expect(result.current.memberDependents).toBeNull();
    });

    it("checkMemberDependents returns correct dependent counts", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const dad = result.current.members.find((m) => m.name === "爸爸");
      act(() => {
        result.current.checkMemberDeps(dad!.id);
      });
      expect(result.current.memberDependents).not.toBeNull();
      // 爸爸 has 5 sources and 2 points sources (ps-cmb, ps-pingan)
      expect(result.current.memberDependents!.sources).toBe(5);
      expect(result.current.memberDependents!.pointsSources).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // activeSection
  // ---------------------------------------------------------------------------
  describe("activeSection", () => {
    it("defaults to members section", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      expect(result.current.activeSection).toBe("members");
    });

    it("can switch to other sections", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      act(() => {
        result.current.setActiveSection("timezone");
      });
      expect(result.current.activeSection).toBe("timezone");
      act(() => {
        result.current.setActiveSection("preferences");
      });
      expect(result.current.activeSection).toBe("preferences");
    });
  });

  // ---------------------------------------------------------------------------
  // timezone
  // ---------------------------------------------------------------------------
  describe("timezone", () => {
    it("defaults to Asia/Shanghai", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      expect(result.current.timezone).toBe("Asia/Shanghai");
    });

    it("can be changed via setTimezone", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      act(() => {
        result.current.setTimezone("America/New_York");
      });
      expect(result.current.timezone).toBe("America/New_York");
    });

    it("provides a list of timezone options", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      expect(Array.isArray(result.current.timezoneOptions)).toBe(true);
      expect(result.current.timezoneOptions.length).toBeGreaterThanOrEqual(5);
    });

    it("each timezone option has value, label, and offsetLabel", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      for (const opt of result.current.timezoneOptions) {
        expect(opt).toHaveProperty("value");
        expect(opt).toHaveProperty("label");
        expect(opt).toHaveProperty("offsetLabel");
        expect(typeof opt.value).toBe("string");
        expect(typeof opt.label).toBe("string");
        expect(typeof opt.offsetLabel).toBe("string");
      }
    });

    it("timezone options include Asia/Shanghai", () => {
      const { result } = renderHook(() => useSettingsViewModel());
      const shanghai = result.current.timezoneOptions.find(
        (o) => o.value === "Asia/Shanghai",
      );
      expect(shanghai).toBeDefined();
      expect(shanghai!.offsetLabel).toBe("UTC+8");
    });
  });
});
