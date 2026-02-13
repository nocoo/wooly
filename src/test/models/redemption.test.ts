import { describe, it, expect } from "vitest";
import {
  addRedemption,
  removeRedemption,
  getRedemptionsInWindow,
} from "@/models/redemption";
import type {
  Redemption,
  CreateRedemptionInput,
  CycleWindow,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRedemption(overrides: Partial<Redemption> = {}): Redemption {
  return {
    id: "r1",
    benefitId: "b1",
    memberId: "m1",
    redeemedAt: "2026-02-10T10:00:00Z",
    memo: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// addRedemption
// ---------------------------------------------------------------------------

describe("addRedemption", () => {
  const existing = [makeRedemption({ id: "r1" })];

  it("appends a new redemption with generated id", () => {
    const input: CreateRedemptionInput = {
      benefitId: "b1",
      memberId: "m1",
    };
    const result = addRedemption(existing, input);
    expect(result).toHaveLength(2);
    expect(result[1].benefitId).toBe("b1");
    expect(result[1].memberId).toBe("m1");
    expect(result[1].id).toBeTruthy();
    expect(result[1].redeemedAt).toBeTruthy();
  });

  it("uses provided redeemedAt if given", () => {
    const input: CreateRedemptionInput = {
      benefitId: "b1",
      memberId: "m1",
      redeemedAt: "2026-02-15T09:00:00Z",
    };
    const result = addRedemption(existing, input);
    expect(result[1].redeemedAt).toBe("2026-02-15T09:00:00Z");
  });

  it("applies optional memo", () => {
    const input: CreateRedemptionInput = {
      benefitId: "b1",
      memberId: "m1",
      memo: "Used at airport",
    };
    const result = addRedemption(existing, input);
    expect(result[1].memo).toBe("Used at airport");
  });

  it("does not mutate the original array", () => {
    const input: CreateRedemptionInput = {
      benefitId: "b1",
      memberId: "m1",
    };
    const result = addRedemption(existing, input);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// removeRedemption
// ---------------------------------------------------------------------------

describe("removeRedemption", () => {
  const existing = [
    makeRedemption({ id: "r1" }),
    makeRedemption({ id: "r2" }),
  ];

  it("removes the redemption with matching id", () => {
    const result = removeRedemption(existing, "r1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r2");
  });

  it("returns same-length array if id not found", () => {
    const result = removeRedemption(existing, "r999");
    expect(result).toHaveLength(2);
  });

  it("does not mutate the original array", () => {
    removeRedemption(existing, "r1");
    expect(existing).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getRedemptionsInWindow
// ---------------------------------------------------------------------------

describe("getRedemptionsInWindow", () => {
  const window: CycleWindow = {
    start: "2026-02-01",
    end: "2026-03-01",
  };

  const redemptions = [
    makeRedemption({ id: "r1", benefitId: "b1", redeemedAt: "2026-01-15T10:00:00Z" }), // before window
    makeRedemption({ id: "r2", benefitId: "b1", redeemedAt: "2026-02-01T00:00:00Z" }), // on start (inclusive)
    makeRedemption({ id: "r3", benefitId: "b1", redeemedAt: "2026-02-15T10:00:00Z" }), // in window
    makeRedemption({ id: "r4", benefitId: "b1", redeemedAt: "2026-03-01T00:00:00Z" }), // on end (exclusive)
    makeRedemption({ id: "r5", benefitId: "b2", redeemedAt: "2026-02-10T10:00:00Z" }), // different benefit
  ];

  it("returns redemptions for the benefit within the window [start, end)", () => {
    const result = getRedemptionsInWindow(redemptions, "b1", window);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["r2", "r3"]);
  });

  it("excludes redemptions from other benefits", () => {
    const result = getRedemptionsInWindow(redemptions, "b2", window);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r5");
  });

  it("returns empty array when no matches", () => {
    const result = getRedemptionsInWindow(redemptions, "b999", window);
    expect(result).toHaveLength(0);
  });

  it("returns empty for empty redemptions array", () => {
    const result = getRedemptionsInWindow([], "b1", window);
    expect(result).toHaveLength(0);
  });
});
