import { describe, it, expect } from 'vitest';
import {
  epochToIso,
  epochToIsoNullable,
  isoToEpoch,
  isoToEpochNullable,
  rowToMember,
  memberToRow,
  rowToSource,
  sourceToRow,
  rowToBenefit,
  benefitToRow,
  rowToRedemption,
  redemptionToRow,
  rowToPointsSource,
  pointsSourceToRow,
  rowToRedeemable,
  redeemableToRow,
} from '../src/mapper.js';
import type { MemberRow, SourceRow, BenefitRow, RedemptionRow, PointsSourceRow, RedeemableRow } from '../src/types.js';
import type { Member, Source, Benefit, Redemption, PointsSource, Redeemable } from '../src/types.js';

// -- Time conversion ----------------------------------------------------------

describe('epochToIso', () => {
  it('converts valid epoch ms to ISO string', () => {
    expect(epochToIso(1700000000000)).toBe('2023-11-14T22:13:20.000Z');
  });

  it('converts epoch 0 to 1970-01-01', () => {
    expect(epochToIso(0)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('throws on NaN', () => {
    expect(() => epochToIso(NaN)).toThrow('Invalid epoch ms');
  });
});

describe('epochToIsoNullable', () => {
  it('returns null for null input', () => {
    expect(epochToIsoNullable(null)).toBeNull();
  });

  it('converts valid epoch ms', () => {
    expect(epochToIsoNullable(1700000000000)).toBe('2023-11-14T22:13:20.000Z');
  });
});

describe('isoToEpoch', () => {
  it('converts valid ISO string to epoch ms', () => {
    expect(isoToEpoch('2023-11-14T22:13:20.000Z')).toBe(1700000000000);
  });

  it('throws on invalid date string', () => {
    expect(() => isoToEpoch('not-a-date')).toThrow('Invalid ISO date');
  });

  it('throws on empty string', () => {
    expect(() => isoToEpoch('')).toThrow('Invalid ISO date');
  });
});

describe('isoToEpochNullable', () => {
  it('returns null for null input', () => {
    expect(isoToEpochNullable(null)).toBeNull();
  });

  it('converts valid ISO string', () => {
    expect(isoToEpochNullable('2023-11-14T22:13:20.000Z')).toBe(1700000000000);
  });

  it('throws on invalid non-null input', () => {
    expect(() => isoToEpochNullable('bad')).toThrow('Invalid ISO date');
  });
});

// -- Member round-trip --------------------------------------------------------

describe('member mapper', () => {
  const row: MemberRow = {
    id: 'm1',
    name: 'Alice',
    relationship: 'self',
    avatar: 'https://example.com/a.png',
    created_at: 1700000000000,
  };

  const entity: Member = {
    id: 'm1',
    name: 'Alice',
    relationship: 'self',
    avatar: 'https://example.com/a.png',
    createdAt: '2023-11-14T22:13:20.000Z',
  };

  it('rowToMember converts correctly', () => {
    expect(rowToMember(row)).toEqual(entity);
  });

  it('memberToRow converts correctly', () => {
    expect(memberToRow(entity)).toEqual(row);
  });

  it('round-trips: row → entity → row', () => {
    expect(memberToRow(rowToMember(row))).toEqual(row);
  });

  it('handles null avatar', () => {
    const nullRow = { ...row, avatar: null };
    const result = rowToMember(nullRow);
    expect(result.avatar).toBeNull();
    expect(memberToRow(result)).toEqual(nullRow);
  });
});

// -- Source round-trip --------------------------------------------------------

describe('source mapper', () => {
  const row: SourceRow = {
    id: 's1',
    member_id: 'm1',
    name: 'AMEX Gold',
    website: 'https://amex.com',
    icon: null,
    phone: '400-100-0000',
    category: 'credit-card',
    currency: 'CNY',
    cycle_anchor: '{"period":"monthly","anchor":1}',
    valid_from: 1700000000000,
    valid_until: null,
    archived: 0,
    memo: 'primary card',
    cost: '600/year',
    card_number: '1234',
    color_index: 3,
    created_at: 1700000000000,
  };

  it('rowToSource parses cycleAnchor JSON', () => {
    const entity = rowToSource(row);
    expect(entity.cycleAnchor).toEqual({ period: 'monthly', anchor: 1 });
    expect(entity.memberId).toBe('m1');
    expect(entity.cardNumber).toBe('1234');
    expect(entity.archived).toBe(false);
  });

  it('sourceToRow stringifies cycleAnchor', () => {
    const entity = rowToSource(row);
    const backRow = sourceToRow(entity);
    expect(JSON.parse(backRow.cycle_anchor)).toEqual({ period: 'monthly', anchor: 1 });
    expect(backRow.archived).toBe(0);
  });

  it('handles archived=true', () => {
    const archivedRow = { ...row, archived: 1 };
    const entity = rowToSource(archivedRow);
    expect(entity.archived).toBe(true);
    expect(sourceToRow(entity).archived).toBe(1);
  });

  it('handles nullable time fields', () => {
    const entity = rowToSource(row);
    expect(entity.validFrom).toBe('2023-11-14T22:13:20.000Z');
    expect(entity.validUntil).toBeNull();
  });

  it('handles quarterly cycleAnchor with object anchor', () => {
    const qRow = { ...row, cycle_anchor: '{"period":"quarterly","anchor":{"month":1,"day":15}}' };
    const entity = rowToSource(qRow);
    expect(entity.cycleAnchor).toEqual({ period: 'quarterly', anchor: { month: 1, day: 15 } });
    const back = sourceToRow(entity);
    expect(JSON.parse(back.cycle_anchor)).toEqual({ period: 'quarterly', anchor: { month: 1, day: 15 } });
  });
});

// -- Benefit round-trip -------------------------------------------------------

describe('benefit mapper', () => {
  const row: BenefitRow = {
    id: 'b1',
    source_id: 's1',
    name: 'Airport Lounge',
    type: 'quota',
    quota: 4,
    credit_amount: null,
    shared: 1,
    cycle_anchor: '{"period":"yearly","anchor":{"month":1,"day":1}}',
    memo: null,
    created_at: 1700000000000,
  };

  it('converts row to entity', () => {
    const entity = rowToBenefit(row);
    expect(entity.shared).toBe(true);
    expect(entity.quota).toBe(4);
    expect(entity.cycleAnchor).toEqual({ period: 'yearly', anchor: { month: 1, day: 1 } });
  });

  it('handles null cycleAnchor', () => {
    const nullRow = { ...row, cycle_anchor: null };
    const entity = rowToBenefit(nullRow);
    expect(entity.cycleAnchor).toBeNull();
    const back = benefitToRow(entity);
    expect(back.cycle_anchor).toBeNull();
  });

  it('round-trips correctly', () => {
    expect(benefitToRow(rowToBenefit(row))).toEqual(row);
  });
});

// -- Redemption round-trip ----------------------------------------------------

describe('redemption mapper', () => {
  const row: RedemptionRow = {
    id: 'r1',
    benefit_id: 'b1',
    member_id: 'm1',
    redeemed_at: 1700000000000,
    memo: 'used at PVG',
  };

  it('converts both directions', () => {
    const entity = rowToRedemption(row);
    expect(entity.benefitId).toBe('b1');
    expect(entity.redeemedAt).toBe('2023-11-14T22:13:20.000Z');
    expect(redemptionToRow(entity)).toEqual(row);
  });
});

// -- PointsSource round-trip --------------------------------------------------

describe('pointsSource mapper', () => {
  const row: PointsSourceRow = {
    id: 'ps1',
    member_id: 'm1',
    name: 'AMEX Points',
    icon: null,
    balance: 50000,
    memo: null,
    created_at: 1700000000000,
  };

  it('round-trips correctly', () => {
    const entity = rowToPointsSource(row);
    expect(entity.memberId).toBe('m1');
    expect(entity.balance).toBe(50000);
    expect(pointsSourceToRow(entity)).toEqual(row);
  });
});

// -- Redeemable round-trip ----------------------------------------------------

describe('redeemable mapper', () => {
  const row: RedeemableRow = {
    id: 'rd1',
    points_source_id: 'ps1',
    name: 'Flight Upgrade',
    cost: 20000,
    memo: 'domestic only',
    created_at: 1700000000000,
  };

  it('round-trips correctly', () => {
    const entity = rowToRedeemable(row);
    expect(entity.pointsSourceId).toBe('ps1');
    expect(entity.cost).toBe(20000);
    expect(redeemableToRow(entity)).toEqual(row);
  });
});
