import { describe, it, expect } from "vitest";
import {
  addMember,
  updateMember,
  removeMember,
  validateMemberInput,
  checkMemberDependents,
  getRelationshipLabel,
} from "@/models/member";
import type {
  Member,
  Source,
  PointsSource,
  CreateMemberInput,
  UpdateMemberInput,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    name: "张三",
    relationship: "self",
    avatar: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

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

function makePointsSource(overrides: Partial<PointsSource> = {}): PointsSource {
  return {
    id: "ps1",
    memberId: "m1",
    name: "Test Points",
    icon: null,
    balance: 1000,
    memo: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getRelationshipLabel
// ---------------------------------------------------------------------------

describe("getRelationshipLabel", () => {
  it("returns correct Chinese labels", () => {
    expect(getRelationshipLabel("self")).toBe("本人");
    expect(getRelationshipLabel("spouse")).toBe("配偶");
    expect(getRelationshipLabel("parent")).toBe("父母");
    expect(getRelationshipLabel("child")).toBe("子女");
    expect(getRelationshipLabel("sibling")).toBe("兄弟姐妹");
    expect(getRelationshipLabel("other")).toBe("其他");
  });
});

// ---------------------------------------------------------------------------
// CRUD: addMember
// ---------------------------------------------------------------------------

describe("addMember", () => {
  const existing = [makeMember({ id: "m1" })];

  it("appends a new member with generated id and createdAt", () => {
    const input: CreateMemberInput = {
      name: "李四",
      relationship: "spouse",
    };
    const result = addMember(existing, input);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("李四");
    expect(result[1].relationship).toBe("spouse");
    expect(result[1].avatar).toBeNull();
    expect(result[1].id).toBeTruthy();
    expect(result[1].createdAt).toBeTruthy();
  });

  it("applies optional avatar", () => {
    const input: CreateMemberInput = {
      name: "王五",
      relationship: "child",
      avatar: "👦",
    };
    const result = addMember(existing, input);
    expect(result[1].avatar).toBe("👦");
  });

  it("does not mutate the original array", () => {
    const input: CreateMemberInput = {
      name: "赵六",
      relationship: "parent",
    };
    const result = addMember(existing, input);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// CRUD: updateMember
// ---------------------------------------------------------------------------

describe("updateMember", () => {
  const existing = [
    makeMember({ id: "m1", name: "张三" }),
    makeMember({ id: "m2", name: "李四" }),
  ];

  it("updates matching member fields", () => {
    const input: UpdateMemberInput = { name: "张三丰", relationship: "other" };
    const result = updateMember(existing, "m1", input);
    expect(result[0].name).toBe("张三丰");
    expect(result[0].relationship).toBe("other");
  });

  it("does not change other members", () => {
    const input: UpdateMemberInput = { name: "张三丰" };
    const result = updateMember(existing, "m1", input);
    expect(result[1].name).toBe("李四");
  });

  it("does not mutate the original array", () => {
    const input: UpdateMemberInput = { name: "张三丰" };
    updateMember(existing, "m1", input);
    expect(existing[0].name).toBe("张三");
  });
});

// ---------------------------------------------------------------------------
// CRUD: removeMember
// ---------------------------------------------------------------------------

describe("removeMember", () => {
  const existing = [makeMember({ id: "m1" }), makeMember({ id: "m2" })];

  it("removes the member with matching id", () => {
    const result = removeMember(existing, "m1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m2");
  });

  it("returns same-length array if id not found", () => {
    const result = removeMember(existing, "m999");
    expect(result).toHaveLength(2);
  });

  it("does not mutate the original array", () => {
    removeMember(existing, "m1");
    expect(existing).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// validateMemberInput
// ---------------------------------------------------------------------------

describe("validateMemberInput", () => {
  it("returns no errors for valid create input", () => {
    const input: CreateMemberInput = { name: "张三", relationship: "self" };
    expect(validateMemberInput(input, [])).toEqual([]);
  });

  it("returns error for empty name", () => {
    const input: CreateMemberInput = { name: "", relationship: "self" };
    const errors = validateMemberInput(input, []);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for name exceeding 20 chars", () => {
    const input: CreateMemberInput = { name: "a".repeat(21), relationship: "self" };
    const errors = validateMemberInput(input, []);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("returns error for duplicate name", () => {
    const existing = [makeMember({ id: "m1", name: "张三" })];
    const input: CreateMemberInput = { name: "张三", relationship: "spouse" };
    const errors = validateMemberInput(input, existing);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("allows same name when editing the same member", () => {
    const existing = [makeMember({ id: "m1", name: "张三" })];
    const input: UpdateMemberInput = { name: "张三" };
    const errors = validateMemberInput(input, existing, "m1");
    expect(errors.some((e) => e.field === "name")).toBe(false);
  });

  it("returns error for duplicate name when editing a different member", () => {
    const existing = [
      makeMember({ id: "m1", name: "张三" }),
      makeMember({ id: "m2", name: "李四" }),
    ];
    const input: UpdateMemberInput = { name: "张三" };
    const errors = validateMemberInput(input, existing, "m2");
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("allows valid update input with partial fields", () => {
    const input: UpdateMemberInput = { relationship: "parent" };
    expect(validateMemberInput(input, [])).toEqual([]);
  });

  // Branch coverage: create input with explicit undefined name
  it("returns error when create input has name explicitly set to undefined", () => {
    const input = { name: undefined, relationship: "self" } as unknown as CreateMemberInput;
    const errors = validateMemberInput(input, []);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkMemberDependents
// ---------------------------------------------------------------------------

describe("checkMemberDependents", () => {
  it("counts sources and points sources belonging to the member", () => {
    const sources = [
      makeSource({ id: "s1", memberId: "m1" }),
      makeSource({ id: "s2", memberId: "m1" }),
      makeSource({ id: "s3", memberId: "m2" }),
    ];
    const pointsSources = [
      makePointsSource({ id: "ps1", memberId: "m1" }),
      makePointsSource({ id: "ps2", memberId: "m2" }),
    ];
    const result = checkMemberDependents("m1", sources, pointsSources);
    expect(result.sources).toBe(2);
    expect(result.pointsSources).toBe(1);
  });

  it("returns 0 when no dependents", () => {
    const result = checkMemberDependents("m1", [], []);
    expect(result.sources).toBe(0);
    expect(result.pointsSources).toBe(0);
  });
});
