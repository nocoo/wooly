// Pure business logic for redemption CRUD and window filtering.
// No React dependency — fully testable with plain unit tests.

import type {
  Redemption,
  CreateRedemptionInput,
  CycleWindow,
} from "@/models/types";

// ---------------------------------------------------------------------------
// CRUD pure functions
// ---------------------------------------------------------------------------

/**
 * Add a new redemption. Returns a new array (immutable).
 * Generates `id` automatically. Uses current time if `redeemedAt` not provided.
 */
export function addRedemption(
  redemptions: readonly Redemption[],
  input: CreateRedemptionInput,
): Redemption[] {
  const newRedemption: Redemption = {
    id: crypto.randomUUID(),
    benefitId: input.benefitId,
    memberId: input.memberId,
    redeemedAt: input.redeemedAt ?? new Date().toISOString(),
    memo: input.memo ?? null,
  };
  return [...redemptions, newRedemption];
}

/**
 * Remove a redemption by id. Returns a new array (immutable).
 */
export function removeRedemption(
  redemptions: readonly Redemption[],
  id: string,
): Redemption[] {
  return redemptions.filter((r) => r.id !== id);
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Get redemptions for a specific benefit within a cycle window [start, end).
 * The window start is inclusive, end is exclusive.
 */
export function getRedemptionsInWindow(
  redemptions: readonly Redemption[],
  benefitId: string,
  window: CycleWindow,
): Redemption[] {
  return redemptions.filter((r) => {
    if (r.benefitId !== benefitId) return false;
    // Extract date portion from ISO datetime for comparison
    const date = r.redeemedAt.slice(0, 10);
    return date >= window.start && date < window.end;
  });
}
