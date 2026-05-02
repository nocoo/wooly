import { describe, it, expect } from 'vitest';
import { validateDataset } from '../src/validator.js';

// -- Test fixtures ------------------------------------------------------------

/** Minimal valid dataset (empty arrays). */
const minimalDataset = {
  members: [],
  sources: [],
  benefits: [],
  redemptions: [],
  pointsSources: [],
  redeemables: [],
  defaultSettings: { timezone: 'Asia/Shanghai' },
};

/** Full valid dataset with all entity types. */
const fullDataset = {
  members: [
    { id: 'm1', name: 'Alice', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  sources: [
    {
      id: 's1', memberId: 'm1', name: 'AMEX', website: null, icon: null, phone: null,
      category: 'credit-card', currency: 'CNY',
      cycleAnchor: { period: 'monthly', anchor: 1 },
      validFrom: '2024-01-01T00:00:00.000Z', validUntil: null,
      archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  benefits: [
    {
      id: 'b1', sourceId: 's1', name: 'Lounge', type: 'quota',
      quota: 4, creditAmount: null, shared: false, cycleAnchor: null,
      memo: null, createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  redemptions: [
    { id: 'r1', benefitId: 'b1', memberId: 'm1', redeemedAt: '2024-06-15T10:00:00.000Z', memo: null },
  ],
  pointsSources: [
    { id: 'ps1', memberId: 'm1', name: 'Points', icon: null, balance: 1000, memo: null, createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  redeemables: [
    { id: 'rd1', pointsSourceId: 'ps1', name: 'Gift', cost: 500, memo: null, createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  defaultSettings: { timezone: 'Asia/Shanghai' },
};

// -- Phase 1: Schema validation -----------------------------------------------

describe('validateDataset — schema', () => {
  it('accepts minimal empty dataset', () => {
    const result = validateDataset(minimalDataset);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.members).toEqual([]);
      expect(result.data.defaultSettings.timezone).toBe('Asia/Shanghai');
    }
  });

  it('accepts full valid dataset', () => {
    const result = validateDataset(fullDataset);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.members).toHaveLength(1);
      expect(result.data.sources).toHaveLength(1);
      expect(result.data.benefits).toHaveLength(1);
      expect(result.data.redemptions).toHaveLength(1);
      expect(result.data.pointsSources).toHaveLength(1);
      expect(result.data.redeemables).toHaveLength(1);
    }
  });

  it('rejects null input', () => {
    const result = validateDataset(null);
    expect(result.ok).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateDataset('string');
    expect(result.ok).toBe(false);
  });

  it('rejects missing top-level fields', () => {
    const result = validateDataset({ members: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects non-array members field', () => {
    const result = validateDataset({ ...minimalDataset, members: 'not-array' });
    expect(result.ok).toBe(false);
  });

  it('rejects member with missing required fields', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1' }], // missing name, relationship, createdAt
    });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid relationship enum value', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'Test', relationship: 'friend', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid ISO date in member.createdAt', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'Test', relationship: 'self', avatar: null, createdAt: 'not-a-date' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('date'))).toBe(true);
    }
  });

  it('rejects invalid ISO date in source.validFrom', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'A', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
      sources: [{
        id: 's1', memberId: 'm1', name: 'S', website: null, icon: null, phone: null,
        category: 'other', currency: 'CNY',
        cycleAnchor: { period: 'monthly', anchor: 1 },
        validFrom: 'bad-date', validUntil: null,
        archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      }],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid benefit type', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'A', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
      sources: [{
        id: 's1', memberId: 'm1', name: 'S', website: null, icon: null, phone: null,
        category: 'other', currency: 'CNY',
        cycleAnchor: { period: 'monthly', anchor: 1 },
        validFrom: null, validUntil: null,
        archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      }],
      benefits: [{
        id: 'b1', sourceId: 's1', name: 'B', type: 'invalid-type',
        quota: null, creditAmount: null, shared: false, cycleAnchor: null,
        memo: null, createdAt: '2024-01-01T00:00:00.000Z',
      }],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects missing defaultSettings', () => {
    const { defaultSettings: _, ...noSettings } = minimalDataset;
    void _;
    const result = validateDataset(noSettings);
    expect(result.ok).toBe(false);
  });

  it('accepts all source categories', () => {
    for (const cat of ['credit-card', 'insurance', 'membership', 'telecom', 'other']) {
      const result = validateDataset({
        ...minimalDataset,
        members: [{ id: 'm1', name: 'A', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
        sources: [{
          id: 's1', memberId: 'm1', name: 'S', website: null, icon: null, phone: null,
          category: cat, currency: 'CNY',
          cycleAnchor: { period: 'monthly', anchor: 1 },
          validFrom: null, validUntil: null,
          archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        }],
      });
      expect(result.ok).toBe(true);
    }
  });
});

// -- Phase 2: Cross-reference validation --------------------------------------

describe('validateDataset — cross-references', () => {
  it('rejects source with non-existent memberId', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'A', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
      sources: [{
        id: 's1', memberId: 'nonexistent', name: 'S', website: null, icon: null, phone: null,
        category: 'other', currency: 'CNY',
        cycleAnchor: { period: 'monthly', anchor: 1 },
        validFrom: null, validUntil: null,
        archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('memberId');
      expect(result.errors[0]).toContain('nonexistent');
    }
  });

  it('rejects benefit with non-existent sourceId', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'A', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
      sources: [{
        id: 's1', memberId: 'm1', name: 'S', website: null, icon: null, phone: null,
        category: 'other', currency: 'CNY',
        cycleAnchor: { period: 'monthly', anchor: 1 },
        validFrom: null, validUntil: null,
        archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      }],
      benefits: [{
        id: 'b1', sourceId: 'nonexistent', name: 'B', type: 'quota',
        quota: 4, creditAmount: null, shared: false, cycleAnchor: null,
        memo: null, createdAt: '2024-01-01T00:00:00.000Z',
      }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('sourceId');
    }
  });

  it('rejects redemption with non-existent benefitId', () => {
    const result = validateDataset({
      ...fullDataset,
      redemptions: [{ id: 'r1', benefitId: 'nonexistent', memberId: 'm1', redeemedAt: '2024-06-15T10:00:00.000Z', memo: null }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('benefitId');
    }
  });

  it('rejects redemption with non-existent memberId', () => {
    const result = validateDataset({
      ...fullDataset,
      redemptions: [{ id: 'r1', benefitId: 'b1', memberId: 'nonexistent', redeemedAt: '2024-06-15T10:00:00.000Z', memo: null }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('memberId');
    }
  });

  it('rejects pointsSource with non-existent memberId', () => {
    const result = validateDataset({
      ...minimalDataset,
      pointsSources: [{ id: 'ps1', memberId: 'nonexistent', name: 'P', icon: null, balance: 0, memo: null, createdAt: '2024-01-01T00:00:00.000Z' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('memberId');
    }
  });

  it('rejects redeemable with non-existent pointsSourceId', () => {
    const result = validateDataset({
      ...minimalDataset,
      members: [{ id: 'm1', name: 'A', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' }],
      pointsSources: [{ id: 'ps1', memberId: 'm1', name: 'P', icon: null, balance: 0, memo: null, createdAt: '2024-01-01T00:00:00.000Z' }],
      redeemables: [{ id: 'rd1', pointsSourceId: 'nonexistent', name: 'R', cost: 100, memo: null, createdAt: '2024-01-01T00:00:00.000Z' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('pointsSourceId');
    }
  });

  it('accepts dataset with valid cross-references', () => {
    const result = validateDataset(fullDataset);
    expect(result.ok).toBe(true);
  });
});
