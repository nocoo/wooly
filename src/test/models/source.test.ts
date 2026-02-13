import { describe, it, expect } from "vitest";
import {
  extractDomain,
  resolveSourceIcon,
  isSourceExpired,
  isSourceExpiringSoon,
  addSource,
  updateSource,
  removeSource,
  toggleSourceArchived,
  validateSourceInput,
  checkSourceDependents,
} from "@/models/source";
import type {
  Source,
  Benefit,
  CreateSourceInput,
  UpdateSourceInput,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "s1",
    memberId: "m1",
    name: "Test Source",
    website: null,
    icon: null,
    phone: null,
    category: "credit-card",
    currency: "CNY",
    cycleAnchor: { period: "monthly", anchor: 1 },
    validFrom: null,
    validUntil: null,
    archived: false,
    memo: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

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
// extractDomain
// ---------------------------------------------------------------------------

describe("extractDomain", () => {
  it("extracts domain from https URL", () => {
    expect(extractDomain("https://www.cmbchina.com")).toBe("cmbchina.com");
  });

  it("extracts domain from http URL", () => {
    expect(extractDomain("http://www.example.org/path")).toBe("example.org");
  });

  it("strips www prefix", () => {
    expect(extractDomain("https://www.taobao.com")).toBe("taobao.com");
  });

  it("preserves subdomain that is not www", () => {
    expect(extractDomain("https://mail.google.com")).toBe("mail.google.com");
  });

  it("returns null for invalid URL", () => {
    expect(extractDomain("not-a-url")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractDomain("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveSourceIcon
// ---------------------------------------------------------------------------

describe("resolveSourceIcon", () => {
  it("returns favicon when website is set", () => {
    const source = makeSource({ website: "https://www.cmbchina.com" });
    const result = resolveSourceIcon(source);
    expect(result.type).toBe("favicon");
    expect(result.value).toBe("https://favicon.im/cmbchina.com");
  });

  it("falls back to icon when website is null but icon is set", () => {
    const source = makeSource({ website: null, icon: "💳" });
    const result = resolveSourceIcon(source);
    expect(result.type).toBe("icon");
    expect(result.value).toBe("💳");
  });

  it("falls back to category default when both website and icon are null", () => {
    const source = makeSource({ website: null, icon: null, category: "credit-card" });
    const result = resolveSourceIcon(source);
    expect(result.type).toBe("category");
    expect(result.value).toBeTruthy();
  });

  it("falls back to icon when website has invalid URL", () => {
    const source = makeSource({ website: "not-a-url", icon: "🏦" });
    const result = resolveSourceIcon(source);
    expect(result.type).toBe("icon");
    expect(result.value).toBe("🏦");
  });

  it("falls back to category when website is invalid and no icon", () => {
    const source = makeSource({ website: "bad", icon: null, category: "insurance" });
    const result = resolveSourceIcon(source);
    expect(result.type).toBe("category");
  });

  it("returns different default icons for different categories", () => {
    const creditCard = resolveSourceIcon(makeSource({ category: "credit-card" }));
    const insurance = resolveSourceIcon(makeSource({ category: "insurance" }));
    const membership = resolveSourceIcon(makeSource({ category: "membership" }));
    const telecom = resolveSourceIcon(makeSource({ category: "telecom" }));
    const other = resolveSourceIcon(makeSource({ category: "other" }));

    const values = new Set([
      creditCard.value,
      insurance.value,
      membership.value,
      telecom.value,
      other.value,
    ]);
    // At least credit-card, insurance, membership should have distinct icons
    expect(values.size).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// isSourceExpired
// ---------------------------------------------------------------------------

describe("isSourceExpired", () => {
  it("returns false when validUntil is null", () => {
    const source = makeSource({ validUntil: null });
    expect(isSourceExpired(source, "2026-02-13")).toBe(false);
  });

  it("returns false when validUntil is in the future", () => {
    const source = makeSource({ validUntil: "2027-01-01" });
    expect(isSourceExpired(source, "2026-02-13")).toBe(false);
  });

  it("returns true when validUntil is in the past", () => {
    const source = makeSource({ validUntil: "2026-01-01" });
    expect(isSourceExpired(source, "2026-02-13")).toBe(true);
  });

  it("returns false when validUntil equals today (still valid on last day)", () => {
    const source = makeSource({ validUntil: "2026-02-13" });
    expect(isSourceExpired(source, "2026-02-13")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSourceExpiringSoon
// ---------------------------------------------------------------------------

describe("isSourceExpiringSoon", () => {
  it("returns false when validUntil is null", () => {
    const source = makeSource({ validUntil: null });
    expect(isSourceExpiringSoon(source, "2026-02-13")).toBe(false);
  });

  it("returns false when validUntil is far in the future", () => {
    const source = makeSource({ validUntil: "2027-01-01" });
    expect(isSourceExpiringSoon(source, "2026-02-13")).toBe(false);
  });

  it("returns true when validUntil is within default 30-day threshold", () => {
    const source = makeSource({ validUntil: "2026-03-01" });
    expect(isSourceExpiringSoon(source, "2026-02-13")).toBe(true);
  });

  it("returns false when already expired", () => {
    const source = makeSource({ validUntil: "2026-01-01" });
    expect(isSourceExpiringSoon(source, "2026-02-13")).toBe(false);
  });

  it("respects custom threshold", () => {
    const source = makeSource({ validUntil: "2026-02-20" });
    expect(isSourceExpiringSoon(source, "2026-02-13", 7)).toBe(true);
    expect(isSourceExpiringSoon(source, "2026-02-13", 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CRUD: addSource
// ---------------------------------------------------------------------------

describe("addSource", () => {
  const existing = [makeSource({ id: "s1" })];

  it("appends a new source with generated id and createdAt", () => {
    const input: CreateSourceInput = {
      memberId: "m1",
      name: "New Source",
      category: "membership",
      currency: "CNY",
      cycleAnchor: { period: "yearly", anchor: { month: 1, day: 1 } },
    };
    const result = addSource(existing, input);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("New Source");
    expect(result[1].category).toBe("membership");
    expect(result[1].archived).toBe(false);
    expect(result[1].id).toBeTruthy();
    expect(result[1].createdAt).toBeTruthy();
  });

  it("does not mutate the original array", () => {
    const input: CreateSourceInput = {
      memberId: "m1",
      name: "Another",
      category: "other",
      currency: "USD",
      cycleAnchor: { period: "monthly", anchor: 1 },
    };
    const result = addSource(existing, input);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// CRUD: updateSource
// ---------------------------------------------------------------------------

describe("updateSource", () => {
  const existing = [
    makeSource({ id: "s1", name: "Old Name" }),
    makeSource({ id: "s2", name: "Other" }),
  ];

  it("updates matching source fields", () => {
    const input: UpdateSourceInput = { name: "New Name", currency: "USD" };
    const result = updateSource(existing, "s1", input);
    expect(result[0].name).toBe("New Name");
    expect(result[0].currency).toBe("USD");
  });

  it("does not change other sources", () => {
    const input: UpdateSourceInput = { name: "New Name" };
    const result = updateSource(existing, "s1", input);
    expect(result[1].name).toBe("Other");
  });

  it("does not mutate the original array", () => {
    const input: UpdateSourceInput = { name: "New Name" };
    updateSource(existing, "s1", input);
    expect(existing[0].name).toBe("Old Name");
  });
});

// ---------------------------------------------------------------------------
// CRUD: removeSource
// ---------------------------------------------------------------------------

describe("removeSource", () => {
  const existing = [makeSource({ id: "s1" }), makeSource({ id: "s2" })];

  it("removes the source with matching id", () => {
    const result = removeSource(existing, "s1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
  });

  it("returns same-length array if id not found", () => {
    const result = removeSource(existing, "s999");
    expect(result).toHaveLength(2);
  });

  it("does not mutate the original array", () => {
    removeSource(existing, "s1");
    expect(existing).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// toggleSourceArchived
// ---------------------------------------------------------------------------

describe("toggleSourceArchived", () => {
  it("archives an active source", () => {
    const existing = [makeSource({ id: "s1", archived: false })];
    const result = toggleSourceArchived(existing, "s1");
    expect(result[0].archived).toBe(true);
  });

  it("unarchives an archived source", () => {
    const existing = [makeSource({ id: "s1", archived: true })];
    const result = toggleSourceArchived(existing, "s1");
    expect(result[0].archived).toBe(false);
  });

  it("does not mutate the original array", () => {
    const existing = [makeSource({ id: "s1", archived: false })];
    toggleSourceArchived(existing, "s1");
    expect(existing[0].archived).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateSourceInput
// ---------------------------------------------------------------------------

describe("validateSourceInput", () => {
  const validInput: CreateSourceInput = {
    memberId: "m1",
    name: "Valid Source",
    category: "credit-card",
    currency: "CNY",
    cycleAnchor: { period: "monthly", anchor: 1 },
  };

  it("returns no errors for valid input", () => {
    expect(validateSourceInput(validInput)).toEqual([]);
  });

  it("returns error for empty name", () => {
    const errors = validateSourceInput({ ...validInput, name: "" });
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for name exceeding 50 chars", () => {
    const errors = validateSourceInput({ ...validInput, name: "a".repeat(51) });
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for empty currency", () => {
    const errors = validateSourceInput({ ...validInput, currency: "" });
    expect(errors.some((e) => e.field === "currency")).toBe(true);
  });

  it("returns error for non-3-char currency", () => {
    const errors = validateSourceInput({ ...validInput, currency: "ABCD" });
    expect(errors.some((e) => e.field === "currency")).toBe(true);
  });

  it("returns error for invalid website URL", () => {
    const errors = validateSourceInput({ ...validInput, website: "not-a-url" });
    expect(errors.some((e) => e.field === "website")).toBe(true);
  });

  it("allows valid website URL", () => {
    const errors = validateSourceInput({
      ...validInput,
      website: "https://www.example.com",
    });
    expect(errors.some((e) => e.field === "website")).toBe(false);
  });

  it("allows null website", () => {
    const errors = validateSourceInput({ ...validInput, website: null });
    expect(errors.some((e) => e.field === "website")).toBe(false);
  });

  it("returns error for phone exceeding 20 chars", () => {
    const errors = validateSourceInput({
      ...validInput,
      phone: "a".repeat(21),
    });
    expect(errors.some((e) => e.field === "phone")).toBe(true);
  });

  it("allows valid phone", () => {
    const errors = validateSourceInput({ ...validInput, phone: "95555" });
    expect(errors.some((e) => e.field === "phone")).toBe(false);
  });

  it("returns error when validUntil < validFrom", () => {
    const errors = validateSourceInput({
      ...validInput,
      validFrom: "2026-06-01",
      validUntil: "2026-01-01",
    });
    expect(errors.some((e) => e.field === "validUntil")).toBe(true);
  });

  it("allows validUntil >= validFrom", () => {
    const errors = validateSourceInput({
      ...validInput,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
    });
    expect(errors.some((e) => e.field === "validUntil")).toBe(false);
  });

  it("allows update input with partial fields", () => {
    const update: UpdateSourceInput = { name: "Updated" };
    expect(validateSourceInput(update)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkSourceDependents
// ---------------------------------------------------------------------------

describe("checkSourceDependents", () => {
  it("counts benefits belonging to the source", () => {
    const benefits = [
      makeBenefit({ id: "b1", sourceId: "s1" }),
      makeBenefit({ id: "b2", sourceId: "s1" }),
      makeBenefit({ id: "b3", sourceId: "s2" }),
    ];
    const result = checkSourceDependents("s1", benefits);
    expect(result.benefits).toBe(2);
  });

  it("returns 0 when no benefits belong to the source", () => {
    const benefits = [makeBenefit({ id: "b1", sourceId: "s2" })];
    const result = checkSourceDependents("s1", benefits);
    expect(result.benefits).toBe(0);
  });

  it("returns 0 for empty benefits array", () => {
    const result = checkSourceDependents("s1", []);
    expect(result.benefits).toBe(0);
  });
});
