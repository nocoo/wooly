// Pure business logic for benefit status computation and CRUD operations.
// No React dependency — fully testable with plain unit tests.

import type {
  Benefit,
  BenefitCycleStatus,
  CreateBenefitInput,
  UpdateBenefitInput,
  ValidationError,
} from "@/models/types";

// ---------------------------------------------------------------------------
// Status computation
// ---------------------------------------------------------------------------

/**
 * Compute usage ratio (0–1) from used count and total count.
 * Returns 0 when total is 0, caps at 1 when over-used.
 */
export function computeUsageRatio(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(used / total, 1);
}

/**
 * Classify urgency based on days remaining in the cycle.
 * - urgent:  ≤ 3 days
 * - warning: ≤ 7 days
 * - normal:  > 7 days
 */
export function classifyBenefitUrgency(
  daysLeft: number,
): "urgent" | "warning" | "normal" {
  if (daysLeft <= 3) return "urgent";
  if (daysLeft <= 7) return "warning";
  return "normal";
}

/**
 * Map a BenefitCycleStatus to a Chinese display label.
 */
export function getBenefitStatusLabel(status: BenefitCycleStatus): string {
  const labels: Record<BenefitCycleStatus, string> = {
    available: "可用",
    partially_used: "部分使用",
    exhausted: "已用完",
    expiring_soon: "即将过期",
    pending: "待办",
    not_applicable: "仅提醒",
  };
  return labels[status];
}

export type BenefitStatusSeverity =
  | "success"
  | "info"
  | "muted"
  | "warning"
  | "accent";

/**
 * Map a BenefitCycleStatus to a semantic severity level.
 * View layer is responsible for mapping severity to CSS classes.
 */
export function getBenefitStatusSeverity(
  status: BenefitCycleStatus,
): BenefitStatusSeverity {
  const map: Record<BenefitCycleStatus, BenefitStatusSeverity> = {
    available: "success",
    partially_used: "info",
    exhausted: "muted",
    expiring_soon: "warning",
    pending: "accent",
    not_applicable: "muted",
  };
  return map[status];
}

// ---------------------------------------------------------------------------
// CRUD pure functions
// ---------------------------------------------------------------------------

/**
 * Add a new benefit to the array. Returns a new array (immutable).
 * Generates `id` and `createdAt` automatically.
 */
export function addBenefit(
  benefits: readonly Benefit[],
  input: CreateBenefitInput,
): Benefit[] {
  const newBenefit: Benefit = {
    id: crypto.randomUUID(),
    sourceId: input.sourceId,
    name: input.name,
    type: input.type,
    quota: input.quota ?? null,
    creditAmount: input.creditAmount ?? null,
    shared: input.shared ?? false,
    cycleAnchor: input.cycleAnchor ?? null,
    memo: input.memo ?? null,
    createdAt: new Date().toISOString(),
  };
  return [...benefits, newBenefit];
}

/**
 * Update an existing benefit by id. Returns a new array (immutable).
 * Only applies defined fields from the input.
 */
export function updateBenefit(
  benefits: readonly Benefit[],
  id: string,
  input: UpdateBenefitInput,
): Benefit[] {
  return benefits.map((b) => {
    if (b.id !== id) return b;
    return { ...b, ...stripUndefined(input) };
  });
}

/**
 * Remove a benefit by id. Returns a new array (immutable).
 */
export function removeBenefit(
  benefits: readonly Benefit[],
  id: string,
): Benefit[] {
  return benefits.filter((b) => b.id !== id);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a CreateBenefitInput or UpdateBenefitInput.
 * Returns an empty array when all validations pass.
 */
export function validateBenefitInput(
  input: CreateBenefitInput | UpdateBenefitInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name validation (required for Create, optional for Update)
  if ("sourceId" in input) {
    // CreateBenefitInput — name is required
    const name = input.name;
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "权益名称不能为空" });
    } else if (name.length > 50) {
      errors.push({ field: "name", message: "权益名称不能超过50个字符" });
    }
  } else if (input.name !== undefined) {
    // UpdateBenefitInput — validate only if provided
    if (input.name.trim().length === 0) {
      errors.push({ field: "name", message: "权益名称不能为空" });
    } else if (input.name.length > 50) {
      errors.push({ field: "name", message: "权益名称不能超过50个字符" });
    }
  }

  // Type-specific validation
  const type = "sourceId" in input ? input.type : input.type;

  if (type === "quota") {
    const quota = input.quota;
    if (quota === undefined || quota === null || quota <= 0 || !Number.isInteger(quota)) {
      errors.push({ field: "quota", message: "次数型权益必须指定正整数配额" });
    }
  }

  if (type === "credit") {
    const creditAmount = input.creditAmount;
    if (creditAmount === undefined || creditAmount === null || creditAmount <= 0) {
      errors.push({ field: "creditAmount", message: "额度型权益必须指定正数额度" });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Remove undefined keys from an object so spread doesn't overwrite with undefined. */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
