// ---------------------------------------------------------------------------
// Dataset validator — runtime schema validation using valibot.
//
// Two-phase validation:
//   1. valibot schema parse — structure, types, ISO date validity
//   2. Cross-reference check — FK consistency within the dataset
// ---------------------------------------------------------------------------

import * as v from 'valibot';
import type { Dataset } from './types.js';

// -- Custom pipes -------------------------------------------------------------

/** Validates that a string is a parseable ISO date (non-NaN). */
const isoDate = v.pipe(
  v.string(),
  v.check(
    (s) => !isNaN(new Date(s).getTime()),
    'Invalid ISO date string',
  ),
);

/** Nullable ISO date — null is allowed. */
const isoDateNullable = v.nullable(isoDate);

// -- Entity schemas -----------------------------------------------------------

const MemberSchema = v.object({
  id: v.string(),
  name: v.string(),
  relationship: v.picklist([
    'self',
    'spouse',
    'parent',
    'child',
    'sibling',
    'other',
  ]),
  avatar: v.nullable(v.string()),
  createdAt: isoDate,
});

const CycleAnchorSchema = v.object({
  period: v.picklist(['monthly', 'quarterly', 'yearly']),
  anchor: v.union([
    v.number(),
    v.object({ month: v.number(), day: v.number() }),
  ]),
});

const SourceSchema = v.object({
  id: v.string(),
  memberId: v.string(),
  name: v.string(),
  website: v.nullable(v.string()),
  icon: v.nullable(v.string()),
  phone: v.nullable(v.string()),
  category: v.picklist([
    'credit-card',
    'insurance',
    'membership',
    'telecom',
    'other',
  ]),
  currency: v.string(),
  cycleAnchor: CycleAnchorSchema,
  validFrom: isoDateNullable,
  validUntil: isoDateNullable,
  archived: v.boolean(),
  memo: v.nullable(v.string()),
  cost: v.nullable(v.string()),
  cardNumber: v.nullable(v.string()),
  colorIndex: v.nullable(v.number()),
  createdAt: isoDate,
});

const BenefitSchema = v.object({
  id: v.string(),
  sourceId: v.string(),
  name: v.string(),
  type: v.picklist(['quota', 'credit', 'action']),
  quota: v.nullable(v.number()),
  creditAmount: v.nullable(v.number()),
  shared: v.boolean(),
  cycleAnchor: v.nullable(CycleAnchorSchema),
  memo: v.nullable(v.string()),
  createdAt: isoDate,
});

const RedemptionSchema = v.object({
  id: v.string(),
  benefitId: v.string(),
  memberId: v.string(),
  redeemedAt: isoDate,
  memo: v.nullable(v.string()),
});

const PointsSourceSchema = v.object({
  id: v.string(),
  memberId: v.string(),
  name: v.string(),
  icon: v.nullable(v.string()),
  balance: v.number(),
  memo: v.nullable(v.string()),
  createdAt: isoDate,
});

const RedeemableSchema = v.object({
  id: v.string(),
  pointsSourceId: v.string(),
  name: v.string(),
  cost: v.number(),
  memo: v.nullable(v.string()),
  createdAt: isoDate,
});

const AppSettingsSchema = v.object({
  timezone: v.string(),
});

const DatasetSchema = v.object({
  members: v.array(MemberSchema),
  sources: v.array(SourceSchema),
  benefits: v.array(BenefitSchema),
  redemptions: v.array(RedemptionSchema),
  pointsSources: v.array(PointsSourceSchema),
  redeemables: v.array(RedeemableSchema),
  defaultSettings: AppSettingsSchema,
});

// -- Cross-reference validation -----------------------------------------------

/**
 * Phase 2: Validate FK references within the parsed dataset.
 * Returns a list of human-readable error strings.
 */
function validateCrossReferences(data: Dataset): string[] {
  const errors: string[] = [];

  const memberIds = new Set(data.members.map((m) => m.id));
  const sourceIds = new Set(data.sources.map((s) => s.id));
  const benefitIds = new Set(data.benefits.map((b) => b.id));
  const pointsSourceIds = new Set(data.pointsSources.map((ps) => ps.id));

  for (const s of data.sources) {
    if (!memberIds.has(s.memberId)) {
      errors.push(
        `sources[${s.id}].memberId "${s.memberId}" not found in members`,
      );
    }
  }
  for (const b of data.benefits) {
    if (!sourceIds.has(b.sourceId)) {
      errors.push(
        `benefits[${b.id}].sourceId "${b.sourceId}" not found in sources`,
      );
    }
  }
  for (const r of data.redemptions) {
    if (!benefitIds.has(r.benefitId)) {
      errors.push(
        `redemptions[${r.id}].benefitId "${r.benefitId}" not found in benefits`,
      );
    }
    if (!memberIds.has(r.memberId)) {
      errors.push(
        `redemptions[${r.id}].memberId "${r.memberId}" not found in members`,
      );
    }
  }
  for (const ps of data.pointsSources) {
    if (!memberIds.has(ps.memberId)) {
      errors.push(
        `pointsSources[${ps.id}].memberId "${ps.memberId}" not found in members`,
      );
    }
  }
  for (const rd of data.redeemables) {
    if (!pointsSourceIds.has(rd.pointsSourceId)) {
      errors.push(
        `redeemables[${rd.id}].pointsSourceId "${rd.pointsSourceId}" not found in pointsSources`,
      );
    }
  }

  return errors;
}

// -- Public API ---------------------------------------------------------------

export type ValidateResult =
  | { ok: true; data: Dataset }
  | { ok: false; errors: string[] };

/**
 * Validate an unknown input as a Dataset.
 *
 * Phase 1: valibot schema parse (structure, types, ISO dates).
 * Phase 2: Cross-reference FK consistency within the dataset.
 *
 * Returns `{ ok: true, data }` or `{ ok: false, errors }`.
 */
export function validateDataset(input: unknown): ValidateResult {
  const result = v.safeParse(DatasetSchema, input);
  if (!result.success) {
    const errors = v.flatten(result.issues);
    const messages: string[] = [];

    // Collect nested errors
    if (errors.root) {
      messages.push(...errors.root);
    }
    if (errors.nested) {
      for (const [path, msgs] of Object.entries(errors.nested)) {
        if (msgs) {
          for (const msg of msgs) {
            messages.push(`${path}: ${msg}`);
          }
        }
      }
    }

    return { ok: false, errors: messages.length > 0 ? messages : ['Invalid dataset'] };
  }

  // Phase 2: cross-reference validation
  const data = result.output as Dataset;
  const refErrors = validateCrossReferences(data);
  if (refErrors.length > 0) {
    return { ok: false, errors: refErrors };
  }

  return { ok: true, data };
}
