import { describe, it, expect } from "vitest";
import {
  computeAffordableItems,
  addPointsSource,
  updatePointsSource,
  removePointsSource,
  addRedeemable,
  updateRedeemable,
  removeRedeemable,
  validatePointsSourceInput,
  validateRedeemableInput,
  checkPointsSourceDependents,
} from "@/models/points";
import type {
  PointsSource,
  Redeemable,
  CreatePointsSourceInput,
  UpdatePointsSourceInput,
  CreateRedeemableInput,
  UpdateRedeemableInput,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePointsSource(overrides: Partial<PointsSource> = {}): PointsSource {
  return {
    id: "ps1",
    memberId: "m1",
    name: "Test Points",
    icon: null,
    balance: 10000,
    memo: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeRedeemable(overrides: Partial<Redeemable> = {}): Redeemable {
  return {
    id: "rd1",
    pointsSourceId: "ps1",
    name: "Test Item",
    cost: 5000,
    memo: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeAffordableItems
// ---------------------------------------------------------------------------

describe("computeAffordableItems", () => {
  it("returns items that the balance can afford", () => {
    const redeemables = [
      makeRedeemable({ id: "rd1", cost: 3000 }),
      makeRedeemable({ id: "rd2", cost: 10000 }),
      makeRedeemable({ id: "rd3", cost: 15000 }),
    ];
    const result = computeAffordableItems(redeemables, 10000);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["rd1", "rd2"]);
  });

  it("returns empty when balance is 0", () => {
    const redeemables = [makeRedeemable({ cost: 100 })];
    const result = computeAffordableItems(redeemables, 0);
    expect(result).toHaveLength(0);
  });

  it("returns all items when balance is very high", () => {
    const redeemables = [
      makeRedeemable({ id: "rd1", cost: 100 }),
      makeRedeemable({ id: "rd2", cost: 200 }),
    ];
    const result = computeAffordableItems(redeemables, 999999);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// CRUD: PointsSource
// ---------------------------------------------------------------------------

describe("addPointsSource", () => {
  const existing = [makePointsSource({ id: "ps1" })];

  it("appends a new points source with generated id and createdAt", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "New Points",
      balance: 5000,
    };
    const result = addPointsSource(existing, input);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("New Points");
    expect(result[1].balance).toBe(5000);
    expect(result[1].id).toBeTruthy();
    expect(result[1].createdAt).toBeTruthy();
  });

  it("does not mutate the original array", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "Another",
      balance: 0,
    };
    const result = addPointsSource(existing, input);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

describe("updatePointsSource", () => {
  const existing = [
    makePointsSource({ id: "ps1", name: "Old", balance: 1000 }),
    makePointsSource({ id: "ps2", name: "Other" }),
  ];

  it("updates matching points source fields", () => {
    const input: UpdatePointsSourceInput = { name: "New", balance: 2000 };
    const result = updatePointsSource(existing, "ps1", input);
    expect(result[0].name).toBe("New");
    expect(result[0].balance).toBe(2000);
  });

  it("does not change other points sources", () => {
    const input: UpdatePointsSourceInput = { name: "New" };
    const result = updatePointsSource(existing, "ps1", input);
    expect(result[1].name).toBe("Other");
  });

  it("does not mutate the original array", () => {
    const input: UpdatePointsSourceInput = { name: "New" };
    updatePointsSource(existing, "ps1", input);
    expect(existing[0].name).toBe("Old");
  });
});

describe("removePointsSource", () => {
  const existing = [
    makePointsSource({ id: "ps1" }),
    makePointsSource({ id: "ps2" }),
  ];

  it("removes the points source with matching id", () => {
    const result = removePointsSource(existing, "ps1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ps2");
  });

  it("returns same-length array if id not found", () => {
    const result = removePointsSource(existing, "ps999");
    expect(result).toHaveLength(2);
  });

  it("does not mutate the original array", () => {
    removePointsSource(existing, "ps1");
    expect(existing).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// CRUD: Redeemable
// ---------------------------------------------------------------------------

describe("addRedeemable", () => {
  const existing = [makeRedeemable({ id: "rd1" })];

  it("appends a new redeemable with generated id and createdAt", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "New Item",
      cost: 3000,
    };
    const result = addRedeemable(existing, input);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("New Item");
    expect(result[1].cost).toBe(3000);
    expect(result[1].id).toBeTruthy();
  });

  it("does not mutate the original array", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "Another",
      cost: 100,
    };
    const result = addRedeemable(existing, input);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

describe("updateRedeemable", () => {
  const existing = [
    makeRedeemable({ id: "rd1", name: "Old Item", cost: 5000 }),
    makeRedeemable({ id: "rd2", name: "Other" }),
  ];

  it("updates matching redeemable fields", () => {
    const input: UpdateRedeemableInput = { name: "New Item", cost: 8000 };
    const result = updateRedeemable(existing, "rd1", input);
    expect(result[0].name).toBe("New Item");
    expect(result[0].cost).toBe(8000);
  });

  it("does not mutate the original array", () => {
    const input: UpdateRedeemableInput = { name: "New Item" };
    updateRedeemable(existing, "rd1", input);
    expect(existing[0].name).toBe("Old Item");
  });
});

describe("removeRedeemable", () => {
  const existing = [
    makeRedeemable({ id: "rd1" }),
    makeRedeemable({ id: "rd2" }),
  ];

  it("removes the redeemable with matching id", () => {
    const result = removeRedeemable(existing, "rd1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rd2");
  });

  it("does not mutate the original array", () => {
    removeRedeemable(existing, "rd1");
    expect(existing).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// validatePointsSourceInput
// ---------------------------------------------------------------------------

describe("validatePointsSourceInput", () => {
  it("returns no errors for valid input", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "Valid Points",
      balance: 1000,
    };
    expect(validatePointsSourceInput(input)).toEqual([]);
  });

  it("returns error for empty name", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "",
      balance: 1000,
    };
    const errors = validatePointsSourceInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for name exceeding 50 chars", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "a".repeat(51),
      balance: 1000,
    };
    const errors = validatePointsSourceInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for negative balance", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "Valid",
      balance: -100,
    };
    const errors = validatePointsSourceInput(input);
    expect(errors.some((e) => e.field === "balance")).toBe(true);
  });

  it("allows zero balance", () => {
    const input: CreatePointsSourceInput = {
      memberId: "m1",
      name: "Valid",
      balance: 0,
    };
    expect(validatePointsSourceInput(input)).toEqual([]);
  });

  it("allows update input with partial fields", () => {
    const input: UpdatePointsSourceInput = { balance: 500 };
    expect(validatePointsSourceInput(input)).toEqual([]);
  });

  // Update-path branch coverage
  it("returns error when update balance is negative", () => {
    const input: UpdatePointsSourceInput = { balance: -1 };
    const errors = validatePointsSourceInput(input);
    expect(errors.some((e) => e.field === "balance")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateRedeemableInput
// ---------------------------------------------------------------------------

describe("validateRedeemableInput", () => {
  it("returns no errors for valid input", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "Valid Item",
      cost: 1000,
    };
    expect(validateRedeemableInput(input)).toEqual([]);
  });

  it("returns error for empty name", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "",
      cost: 1000,
    };
    const errors = validateRedeemableInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for name exceeding 50 chars", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "a".repeat(51),
      cost: 1000,
    };
    const errors = validateRedeemableInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for non-positive cost", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "Valid",
      cost: 0,
    };
    const errors = validateRedeemableInput(input);
    expect(errors.some((e) => e.field === "cost")).toBe(true);
  });

  it("returns error for non-integer cost", () => {
    const input: CreateRedeemableInput = {
      pointsSourceId: "ps1",
      name: "Valid",
      cost: 1.5,
    };
    const errors = validateRedeemableInput(input);
    expect(errors.some((e) => e.field === "cost")).toBe(true);
  });

  it("allows update input with partial fields", () => {
    const input: UpdateRedeemableInput = { cost: 2000 };
    expect(validateRedeemableInput(input)).toEqual([]);
  });

  // Update-path branch coverage
  it("returns error when update name is empty", () => {
    const input: UpdateRedeemableInput = { name: "   " };
    const errors = validateRedeemableInput(input);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error when update name exceeds 50 characters", () => {
    const input: UpdateRedeemableInput = { name: "a".repeat(51) };
    const errors = validateRedeemableInput(input);
    expect(errors.some((e) => e.field === "name" && e.message.includes("50"))).toBe(true);
  });

  it("returns error when update cost is not a positive integer", () => {
    expect(validateRedeemableInput({ cost: 0 } as UpdateRedeemableInput).some((e) => e.field === "cost")).toBe(true);
    expect(validateRedeemableInput({ cost: -1 } as UpdateRedeemableInput).some((e) => e.field === "cost")).toBe(true);
    expect(validateRedeemableInput({ cost: 1.5 } as UpdateRedeemableInput).some((e) => e.field === "cost")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkPointsSourceDependents
// ---------------------------------------------------------------------------

describe("checkPointsSourceDependents", () => {
  it("counts redeemables belonging to the points source", () => {
    const redeemables = [
      makeRedeemable({ id: "rd1", pointsSourceId: "ps1" }),
      makeRedeemable({ id: "rd2", pointsSourceId: "ps1" }),
      makeRedeemable({ id: "rd3", pointsSourceId: "ps2" }),
    ];
    const result = checkPointsSourceDependents("ps1", redeemables);
    expect(result.redeemables).toBe(2);
  });

  it("returns 0 when no redeemables", () => {
    const result = checkPointsSourceDependents("ps1", []);
    expect(result.redeemables).toBe(0);
  });
});
