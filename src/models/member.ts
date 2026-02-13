// Pure business logic for member CRUD, validation, and relationship labels.
// No React dependency — fully testable with plain unit tests.

import type {
  Member,
  MemberRelationship,
  Source,
  PointsSource,
  CreateMemberInput,
  UpdateMemberInput,
  ValidationError,
  DependentsSummary,
} from "@/models/types";
import { stripUndefined } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Map a MemberRelationship to a Chinese display label. */
const RELATIONSHIP_LABELS: Record<MemberRelationship, string> = {
  self: "本人",
  spouse: "配偶",
  parent: "父母",
  child: "子女",
  sibling: "兄弟姐妹",
  other: "其他",
};

export function getRelationshipLabel(relationship: MemberRelationship): string {
  return RELATIONSHIP_LABELS[relationship];
}

// ---------------------------------------------------------------------------
// CRUD pure functions
// ---------------------------------------------------------------------------

/**
 * Add a new member. Returns a new array (immutable).
 * Generates `id` and `createdAt` automatically.
 */
export function addMember(
  members: readonly Member[],
  input: CreateMemberInput,
): Member[] {
  const newMember: Member = {
    id: crypto.randomUUID(),
    name: input.name,
    relationship: input.relationship,
    avatar: input.avatar ?? null,
    createdAt: new Date().toISOString(),
  };
  return [...members, newMember];
}

/**
 * Update an existing member by id. Returns a new array (immutable).
 */
export function updateMember(
  members: readonly Member[],
  id: string,
  input: UpdateMemberInput,
): Member[] {
  return members.map((m) => {
    if (m.id !== id) return m;
    return { ...m, ...stripUndefined(input) };
  });
}

/**
 * Remove a member by id. Returns a new array (immutable).
 */
export function removeMember(
  members: readonly Member[],
  id: string,
): Member[] {
  return members.filter((m) => m.id !== id);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a CreateMemberInput or UpdateMemberInput.
 * Checks name uniqueness against existing members (excluding editingId).
 * Returns an empty array when all validations pass.
 */
export function validateMemberInput(
  input: CreateMemberInput | UpdateMemberInput,
  existingMembers: readonly Member[],
  editingId?: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isCreate = "relationship" in input && "name" in input && !editingId;

  // Name validation
  const name = input.name;
  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "成员名称不能为空" });
    } else if (name.length > 20) {
      errors.push({ field: "name", message: "成员名称不能超过20个字符" });
    } else {
      // Uniqueness check
      const duplicate = existingMembers.find(
        (m) => m.name === name && m.id !== editingId,
      );
      if (duplicate) {
        errors.push({ field: "name", message: "成员名称已存在" });
      }
    }
  } else if (isCreate) {
    errors.push({ field: "name", message: "成员名称不能为空" });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Cascade checks
// ---------------------------------------------------------------------------

/**
 * Count dependents (sources and points sources) belonging to a member.
 * Used to show impact before delete confirmation.
 */
export function checkMemberDependents(
  memberId: string,
  sources: readonly Source[],
  pointsSources: readonly PointsSource[],
): DependentsSummary {
  return {
    sources: sources.filter((s) => s.memberId === memberId).length,
    pointsSources: pointsSources.filter((ps) => ps.memberId === memberId).length,
  };
}
