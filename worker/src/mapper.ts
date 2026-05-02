// ---------------------------------------------------------------------------
// Row mapper — bidirectional conversion between D1 rows and API entities.
//
// DB rows use snake_case columns + INTEGER epoch ms for times.
// API entities use camelCase fields + ISO 8601 strings for times.
// JSON fields (cycleAnchor) are parsed/stringified at this boundary.
// ---------------------------------------------------------------------------

import type {
  MemberRow,
  SourceRow,
  BenefitRow,
  RedemptionRow,
  PointsSourceRow,
  RedeemableRow,
  Member,
  Source,
  Benefit,
  Redemption,
  PointsSource,
  Redeemable,
  CycleAnchor,
} from './types.js';

// -- Time conversion ----------------------------------------------------------

/** Convert epoch ms to ISO 8601 string. Throws on invalid input. */
export function epochToIso(ms: number): string {
  const d = new Date(ms);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid epoch ms: ${ms}`);
  }
  return d.toISOString();
}

/** Convert epoch ms to ISO 8601 string, or null. Throws on invalid non-null input. */
export function epochToIsoNullable(ms: number | null): string | null {
  if (ms === null) return null;
  return epochToIso(ms);
}

/** Convert ISO 8601 string to epoch ms. Throws on invalid input. */
export function isoToEpoch(iso: string): number {
  const ms = new Date(iso).getTime();
  if (isNaN(ms)) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return ms;
}

/** Convert ISO 8601 string to epoch ms, or null. Throws on invalid non-null input. */
export function isoToEpochNullable(iso: string | null): number | null {
  if (iso === null) return null;
  return isoToEpoch(iso);
}

// -- Row → Entity (outbound: DB → API) ----------------------------------------

export function rowToMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship as Member['relationship'],
    avatar: row.avatar,
    createdAt: epochToIso(row.created_at),
  };
}

export function rowToSource(row: SourceRow): Source {
  return {
    id: row.id,
    memberId: row.member_id,
    name: row.name,
    website: row.website,
    icon: row.icon,
    phone: row.phone,
    category: row.category as Source['category'],
    currency: row.currency,
    cycleAnchor: JSON.parse(row.cycle_anchor) as CycleAnchor,
    validFrom: epochToIsoNullable(row.valid_from),
    validUntil: epochToIsoNullable(row.valid_until),
    archived: row.archived === 1,
    memo: row.memo,
    cost: row.cost,
    cardNumber: row.card_number,
    colorIndex: row.color_index,
    createdAt: epochToIso(row.created_at),
  };
}

export function rowToBenefit(row: BenefitRow): Benefit {
  return {
    id: row.id,
    sourceId: row.source_id,
    name: row.name,
    type: row.type as Benefit['type'],
    quota: row.quota,
    creditAmount: row.credit_amount,
    shared: row.shared === 1,
    cycleAnchor: row.cycle_anchor
      ? (JSON.parse(row.cycle_anchor) as CycleAnchor)
      : null,
    memo: row.memo,
    createdAt: epochToIso(row.created_at),
  };
}

export function rowToRedemption(row: RedemptionRow): Redemption {
  return {
    id: row.id,
    benefitId: row.benefit_id,
    memberId: row.member_id,
    redeemedAt: epochToIso(row.redeemed_at),
    memo: row.memo,
  };
}

export function rowToPointsSource(row: PointsSourceRow): PointsSource {
  return {
    id: row.id,
    memberId: row.member_id,
    name: row.name,
    icon: row.icon,
    balance: row.balance,
    memo: row.memo,
    createdAt: epochToIso(row.created_at),
  };
}

export function rowToRedeemable(row: RedeemableRow): Redeemable {
  return {
    id: row.id,
    pointsSourceId: row.points_source_id,
    name: row.name,
    cost: row.cost,
    memo: row.memo,
    createdAt: epochToIso(row.created_at),
  };
}

// -- Entity → Row (inbound: API → DB) ----------------------------------------

export function memberToRow(m: Member): MemberRow {
  return {
    id: m.id,
    name: m.name,
    relationship: m.relationship,
    avatar: m.avatar,
    created_at: isoToEpoch(m.createdAt),
  };
}

export function sourceToRow(s: Source): SourceRow {
  return {
    id: s.id,
    member_id: s.memberId,
    name: s.name,
    website: s.website,
    icon: s.icon,
    phone: s.phone,
    category: s.category,
    currency: s.currency,
    cycle_anchor: JSON.stringify(s.cycleAnchor),
    valid_from: isoToEpochNullable(s.validFrom),
    valid_until: isoToEpochNullable(s.validUntil),
    archived: s.archived ? 1 : 0,
    memo: s.memo,
    cost: s.cost,
    card_number: s.cardNumber,
    color_index: s.colorIndex,
    created_at: isoToEpoch(s.createdAt),
  };
}

export function benefitToRow(b: Benefit): BenefitRow {
  return {
    id: b.id,
    source_id: b.sourceId,
    name: b.name,
    type: b.type,
    quota: b.quota,
    credit_amount: b.creditAmount,
    shared: b.shared ? 1 : 0,
    cycle_anchor: b.cycleAnchor ? JSON.stringify(b.cycleAnchor) : null,
    memo: b.memo,
    created_at: isoToEpoch(b.createdAt),
  };
}

export function redemptionToRow(r: Redemption): RedemptionRow {
  return {
    id: r.id,
    benefit_id: r.benefitId,
    member_id: r.memberId,
    redeemed_at: isoToEpoch(r.redeemedAt),
    memo: r.memo,
  };
}

export function pointsSourceToRow(ps: PointsSource): PointsSourceRow {
  return {
    id: ps.id,
    member_id: ps.memberId,
    name: ps.name,
    icon: ps.icon,
    balance: ps.balance,
    memo: ps.memo,
    created_at: isoToEpoch(ps.createdAt),
  };
}

export function redeemableToRow(rd: Redeemable): RedeemableRow {
  return {
    id: rd.id,
    points_source_id: rd.pointsSourceId,
    name: rd.name,
    cost: rd.cost,
    memo: rd.memo,
    created_at: isoToEpoch(rd.createdAt),
  };
}
