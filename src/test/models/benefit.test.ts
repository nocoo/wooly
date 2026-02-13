import { describe, it, expect } from "vitest";
import {
  computeUsageRatio,
  classifyBenefitUrgency,
  getBenefitStatusLabel,
  getBenefitStatusColorClass,
  addBenefit,
  updateBenefit,
  removeBenefit,
  validateBenefitInput,
} from "@/models/benefit";
import type { Benefit, CreateBenefitInput, UpdateBenefitInput } from "@/models/types";

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

// ---------------------------------------------------------------------------
// computeUsageRatio
// ---------------------------------------------------------------------------

describe("computeUsageRatio", () => {
  it("returns 0 when nothing used", () => {
    expect(computeUsageRatio(0, 6)).toBe(0);
  });

  it("returns 0.5 at half usage", () => {
    expect(computeUsageRatio(3, 6)).toBe(0.5);
  });

  it("returns 1 when fully used", () => {
    expect(computeUsageRatio(6, 6)).toBe(1);
  });

  it("caps at 1 when over-used", () => {
    expect(computeUsageRatio(8, 6)).toBe(1);
  });

  it("returns 0 when total is 0", () => {
    expect(computeUsageRatio(0, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// classifyBenefitUrgency
// ---------------------------------------------------------------------------

describe("classifyBenefitUrgency", () => {
  it("returns 'urgent' when days <= 3", () => {
    expect(classifyBenefitUrgency(0)).toBe("urgent");
    expect(classifyBenefitUrgency(1)).toBe("urgent");
    expect(classifyBenefitUrgency(3)).toBe("urgent");
  });

  it("returns 'warning' when days <= 7", () => {
    expect(classifyBenefitUrgency(4)).toBe("warning");
    expect(classifyBenefitUrgency(7)).toBe("warning");
  });

  it("returns 'normal' when days > 7", () => {
    expect(classifyBenefitUrgency(8)).toBe("normal");
    expect(classifyBenefitUrgency(30)).toBe("normal");
  });
});

// ---------------------------------------------------------------------------
// getBenefitStatusLabel
// ---------------------------------------------------------------------------

describe("getBenefitStatusLabel", () => {
  it("returns correct label for each status", () => {
    expect(getBenefitStatusLabel("available")).toBe("可用");
    expect(getBenefitStatusLabel("partially_used")).toBe("部分使用");
    expect(getBenefitStatusLabel("exhausted")).toBe("已用完");
    expect(getBenefitStatusLabel("expiring_soon")).toBe("即将过期");
    expect(getBenefitStatusLabel("pending")).toBe("待办");
    expect(getBenefitStatusLabel("not_applicable")).toBe("仅提醒");
  });
});

// ---------------------------------------------------------------------------
// getBenefitStatusColorClass
// ---------------------------------------------------------------------------

describe("getBenefitStatusColorClass", () => {
  it("returns a Tailwind class string for each status", () => {
    expect(getBenefitStatusColorClass("available")).toMatch(/green|emerald/);
    expect(getBenefitStatusColorClass("partially_used")).toMatch(/blue|sky/);
    expect(getBenefitStatusColorClass("exhausted")).toMatch(/gray|slate|muted/);
    expect(getBenefitStatusColorClass("expiring_soon")).toMatch(/orange|amber|yellow/);
    expect(getBenefitStatusColorClass("pending")).toMatch(/purple|violet/);
    expect(getBenefitStatusColorClass("not_applicable")).toMatch(/gray|slate|muted/);
  });
});

// ---------------------------------------------------------------------------
// CRUD: addBenefit
// ---------------------------------------------------------------------------

describe("addBenefit", () => {
  const existing = [makeBenefit({ id: "b1" })];

  it("appends a new benefit with generated id and createdAt", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "New Benefit",
      type: "credit",
      creditAmount: 100,
    };
    const result = addBenefit(existing, input);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("New Benefit");
    expect(result[1].type).toBe("credit");
    expect(result[1].creditAmount).toBe(100);
    expect(result[1].id).toBeTruthy();
    expect(result[1].createdAt).toBeTruthy();
  });

  it("does not mutate the original array", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Another",
      type: "action",
    };
    const result = addBenefit(existing, input);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// CRUD: updateBenefit
// ---------------------------------------------------------------------------

describe("updateBenefit", () => {
  const existing = [
    makeBenefit({ id: "b1", name: "Old Name" }),
    makeBenefit({ id: "b2", name: "Other" }),
  ];

  it("updates matching benefit fields", () => {
    const input: UpdateBenefitInput = { name: "New Name", quota: 10 };
    const result = updateBenefit(existing, "b1", input);
    expect(result[0].name).toBe("New Name");
    expect(result[0].quota).toBe(10);
  });

  it("does not change other benefits", () => {
    const input: UpdateBenefitInput = { name: "New Name" };
    const result = updateBenefit(existing, "b1", input);
    expect(result[1].name).toBe("Other");
  });

  it("does not mutate the original array", () => {
    const input: UpdateBenefitInput = { name: "New Name" };
    updateBenefit(existing, "b1", input);
    expect(existing[0].name).toBe("Old Name");
  });
});

// ---------------------------------------------------------------------------
// CRUD: removeBenefit
// ---------------------------------------------------------------------------

describe("removeBenefit", () => {
  const existing = [
    makeBenefit({ id: "b1" }),
    makeBenefit({ id: "b2" }),
  ];

  it("removes the benefit with matching id", () => {
    const result = removeBenefit(existing, "b1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b2");
  });

  it("returns same-length array if id not found", () => {
    const result = removeBenefit(existing, "b999");
    expect(result).toHaveLength(2);
  });

  it("does not mutate the original array", () => {
    removeBenefit(existing, "b1");
    expect(existing).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// validateBenefitInput
// ---------------------------------------------------------------------------

describe("validateBenefitInput", () => {
  it("returns no errors for valid quota input", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Valid Benefit",
      type: "quota",
      quota: 5,
    };
    expect(validateBenefitInput(input)).toEqual([]);
  });

  it("returns no errors for valid credit input", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Valid Credit",
      type: "credit",
      creditAmount: 100,
    };
    expect(validateBenefitInput(input)).toEqual([]);
  });

  it("returns no errors for valid action input", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Valid Action",
      type: "action",
    };
    expect(validateBenefitInput(input)).toEqual([]);
  });

  it("returns error for empty name", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "",
      type: "quota",
      quota: 5,
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for name exceeding 50 chars", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "a".repeat(51),
      type: "quota",
      quota: 5,
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error when quota type has no quota", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Missing Quota",
      type: "quota",
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "quota")).toBe(true);
  });

  it("returns error when quota is not a positive integer", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Bad Quota",
      type: "quota",
      quota: 0,
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "quota")).toBe(true);
  });

  it("returns error when credit type has no creditAmount", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Missing Amount",
      type: "credit",
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "creditAmount")).toBe(true);
  });

  it("returns error when creditAmount is not positive", () => {
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "Bad Amount",
      type: "credit",
      creditAmount: -10,
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "creditAmount")).toBe(true);
  });

  it("allows credit type with null creditAmount (one-click redemption)", () => {
    // Some credit benefits have no specific amount (e.g. "优酷会员月卡")
    // but the validation should still require creditAmount for credit type
    const input: CreateBenefitInput = {
      sourceId: "s1",
      name: "No Amount Credit",
      type: "credit",
      creditAmount: null,
    };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "creditAmount")).toBe(true);
  });

  // Update-path branch coverage
  it("returns error when update name is empty", () => {
    const input: UpdateBenefitInput = { name: "   " };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error when update name exceeds 50 characters", () => {
    const input: UpdateBenefitInput = { name: "a".repeat(51) };
    const errors = validateBenefitInput(input);
    expect(errors.some((e) => e.field === "name" && e.message.includes("50"))).toBe(true);
  });
});
