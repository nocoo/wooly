// Pure business logic for points computation and CRUD operations.
// No React dependency — fully testable with plain unit tests.

import type {
  PointsSource,
  Redeemable,
  CreatePointsSourceInput,
  UpdatePointsSourceInput,
  CreateRedeemableInput,
  UpdateRedeemableInput,
  ValidationError,
  DependentsSummary,
} from "@/models/types";
import { stripUndefined } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

/**
 * Filter redeemables that the given balance can afford.
 * Returns items where cost <= balance.
 */
export function computeAffordableItems(
  redeemables: readonly Redeemable[],
  balance: number,
): Redeemable[] {
  return redeemables.filter((r) => r.cost <= balance);
}

// ---------------------------------------------------------------------------
// CRUD: PointsSource
// ---------------------------------------------------------------------------

/**
 * Add a new points source. Returns a new array (immutable).
 */
export function addPointsSource(
  pointsSources: readonly PointsSource[],
  input: CreatePointsSourceInput,
): PointsSource[] {
  const newPS: PointsSource = {
    id: crypto.randomUUID(),
    memberId: input.memberId,
    name: input.name,
    icon: input.icon ?? null,
    balance: input.balance,
    memo: input.memo ?? null,
    createdAt: new Date().toISOString(),
  };
  return [...pointsSources, newPS];
}

/**
 * Update an existing points source by id. Returns a new array (immutable).
 */
export function updatePointsSource(
  pointsSources: readonly PointsSource[],
  id: string,
  input: UpdatePointsSourceInput,
): PointsSource[] {
  return pointsSources.map((ps) => {
    if (ps.id !== id) return ps;
    return { ...ps, ...stripUndefined(input) };
  });
}

/**
 * Remove a points source by id. Returns a new array (immutable).
 */
export function removePointsSource(
  pointsSources: readonly PointsSource[],
  id: string,
): PointsSource[] {
  return pointsSources.filter((ps) => ps.id !== id);
}

// ---------------------------------------------------------------------------
// CRUD: Redeemable
// ---------------------------------------------------------------------------

/**
 * Add a new redeemable. Returns a new array (immutable).
 */
export function addRedeemable(
  redeemables: readonly Redeemable[],
  input: CreateRedeemableInput,
): Redeemable[] {
  const newItem: Redeemable = {
    id: crypto.randomUUID(),
    pointsSourceId: input.pointsSourceId,
    name: input.name,
    cost: input.cost,
    memo: input.memo ?? null,
    createdAt: new Date().toISOString(),
  };
  return [...redeemables, newItem];
}

/**
 * Update an existing redeemable by id. Returns a new array (immutable).
 */
export function updateRedeemable(
  redeemables: readonly Redeemable[],
  id: string,
  input: UpdateRedeemableInput,
): Redeemable[] {
  return redeemables.map((r) => {
    if (r.id !== id) return r;
    return { ...r, ...stripUndefined(input) };
  });
}

/**
 * Remove a redeemable by id. Returns a new array (immutable).
 */
export function removeRedeemable(
  redeemables: readonly Redeemable[],
  id: string,
): Redeemable[] {
  return redeemables.filter((r) => r.id !== id);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a CreatePointsSourceInput or UpdatePointsSourceInput.
 */
export function validatePointsSourceInput(
  input: CreatePointsSourceInput | UpdatePointsSourceInput,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isCreate = "memberId" in input;

  // Name validation
  if (isCreate) {
    const name = (input as CreatePointsSourceInput).name;
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "积分来源名称不能为空" });
    } else if (name.length > 50) {
      errors.push({ field: "name", message: "积分来源名称不能超过50个字符" });
    }
  } else if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      errors.push({ field: "name", message: "积分来源名称不能为空" });
    } else if (input.name.length > 50) {
      errors.push({ field: "name", message: "积分来源名称不能超过50个字符" });
    }
  }

  // Balance validation
  if (isCreate) {
    const balance = (input as CreatePointsSourceInput).balance;
    if (balance < 0) {
      errors.push({ field: "balance", message: "积分余额不能为负数" });
    }
  } else if (input.balance !== undefined) {
    if (input.balance < 0) {
      errors.push({ field: "balance", message: "积分余额不能为负数" });
    }
  }

  return errors;
}

/**
 * Validate a CreateRedeemableInput or UpdateRedeemableInput.
 */
export function validateRedeemableInput(
  input: CreateRedeemableInput | UpdateRedeemableInput,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isCreate = "pointsSourceId" in input;

  // Name validation
  if (isCreate) {
    const name = (input as CreateRedeemableInput).name;
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "可兑换项名称不能为空" });
    } else if (name.length > 50) {
      errors.push({ field: "name", message: "可兑换项名称不能超过50个字符" });
    }
  } else if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      errors.push({ field: "name", message: "可兑换项名称不能为空" });
    } else if (input.name.length > 50) {
      errors.push({ field: "name", message: "可兑换项名称不能超过50个字符" });
    }
  }

  // Cost validation
  if (isCreate) {
    const cost = (input as CreateRedeemableInput).cost;
    if (!Number.isInteger(cost) || cost <= 0) {
      errors.push({ field: "cost", message: "所需积分必须为正整数" });
    }
  } else if (input.cost !== undefined) {
    if (!Number.isInteger(input.cost) || input.cost <= 0) {
      errors.push({ field: "cost", message: "所需积分必须为正整数" });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Cascade checks
// ---------------------------------------------------------------------------

/**
 * Count redeemables belonging to a points source.
 */
export function checkPointsSourceDependents(
  pointsSourceId: string,
  redeemables: readonly Redeemable[],
): DependentsSummary {
  return {
    redeemables: redeemables.filter((r) => r.pointsSourceId === pointsSourceId).length,
  };
}
