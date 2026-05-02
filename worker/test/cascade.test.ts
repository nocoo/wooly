import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { applyMigration } from '../src/db/migrate.js';
import { readAll, writeAll, resetAll } from '../src/db/operations.js';
import type { Dataset } from '../src/types.js';

let mf: Miniflare;
let db: D1Database;

beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok") } }',
    d1Databases: ['DB'],
  });
  db = await mf.getD1Database('DB');
  const sql = readFileSync(
    new URL('../migrations/0001_init.sql', import.meta.url),
    'utf-8',
  );
  await applyMigration(db, sql);
});

beforeEach(async () => {
  await resetAll(db);
});

afterAll(async () => {
  await mf.dispose();
});

// -- Helpers ------------------------------------------------------------------

/** Seed a full graph: member → source → benefit → redemption + points_source → redeemable */
async function seedFullGraph(db: D1Database): Promise<void> {
  const dataset: Dataset = {
    members: [
      { id: 'm1', name: 'Alice', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'm2', name: 'Bob', relationship: 'spouse', avatar: null, createdAt: '2024-01-02T00:00:00.000Z' },
    ],
    sources: [
      {
        id: 's1', memberId: 'm1', name: 'AMEX Gold', website: null, icon: null, phone: null,
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
        quota: 4, creditAmount: null, shared: false,
        cycleAnchor: { period: 'yearly', anchor: { month: 1, day: 1 } },
        memo: null, createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    redemptions: [
      { id: 'r1', benefitId: 'b1', memberId: 'm1', redeemedAt: '2024-06-15T10:00:00.000Z', memo: null },
      { id: 'r2', benefitId: 'b1', memberId: 'm2', redeemedAt: '2024-06-16T10:00:00.000Z', memo: null },
    ],
    pointsSources: [
      { id: 'ps1', memberId: 'm1', name: 'MR Points', icon: null, balance: 50000, memo: null, createdAt: '2024-01-01T00:00:00.000Z' },
    ],
    redeemables: [
      { id: 'rd1', pointsSourceId: 'ps1', name: 'Flight', cost: 20000, memo: null, createdAt: '2024-01-01T00:00:00.000Z' },
    ],
    defaultSettings: { timezone: 'Asia/Shanghai' },
  };
  await writeAll(db, dataset);
}

// -- PRAGMA foreign_keys verification -----------------------------------------

describe('PRAGMA foreign_keys — D1 enforcement', () => {
  it('has foreign_keys enabled by default', async () => {
    const result = await db.prepare('PRAGMA foreign_keys').first<{ foreign_keys: number }>();
    expect(result?.foreign_keys).toBe(1);
  });
});

// -- Invalid FK insert (proving FK enforcement works) -------------------------

describe('FK enforcement — invalid inserts', () => {
  it('rejects source with non-existent member_id', async () => {
    await expect(
      db.exec(
        "INSERT INTO sources (id, member_id, name, website, icon, phone, category, currency, cycle_anchor, valid_from, valid_until, archived, memo, cost, card_number, color_index, created_at) VALUES ('s_bad', 'no_such_member', 'Card', NULL, NULL, NULL, 'credit-card', 'CNY', '{\"period\":\"monthly\",\"anchor\":1}', NULL, NULL, 0, NULL, NULL, NULL, NULL, 1700000000000)",
      ),
    ).rejects.toThrow();
  });

  it('rejects benefit with non-existent source_id', async () => {
    await seedFullGraph(db);
    await expect(
      db.exec(
        "INSERT INTO benefits (id, source_id, name, type, quota, credit_amount, shared, cycle_anchor, memo, created_at) VALUES ('b_bad', 'no_such_source', 'X', 'quota', 1, NULL, 0, NULL, NULL, 1700000000000)",
      ),
    ).rejects.toThrow();
  });

  it('rejects redemption with non-existent benefit_id', async () => {
    await seedFullGraph(db);
    await expect(
      db.exec(
        "INSERT INTO redemptions (id, benefit_id, member_id, redeemed_at, memo) VALUES ('r_bad', 'no_such_benefit', 'm1', 1700000000000, NULL)",
      ),
    ).rejects.toThrow();
  });

  it('rejects redeemable with non-existent points_source_id', async () => {
    await expect(
      db.exec(
        "INSERT INTO redeemables (id, points_source_id, name, cost, memo, created_at) VALUES ('rd_bad', 'no_such_ps', 'X', 100, NULL, 1700000000000)",
      ),
    ).rejects.toThrow();
  });
});

// -- CASCADE delete from source -----------------------------------------------

describe('CASCADE — source delete propagates to benefits and redemptions', () => {
  it('deleting a source cascades to its benefits and their redemptions', async () => {
    await seedFullGraph(db);

    // Verify baseline
    const before = await readAll(db);
    expect(before.sources).toHaveLength(1);
    expect(before.benefits).toHaveLength(1);
    expect(before.redemptions).toHaveLength(2);

    // Delete the source
    await db.exec("DELETE FROM sources WHERE id = 's1'");

    const after = await readAll(db);
    expect(after.sources).toHaveLength(0);
    expect(after.benefits).toHaveLength(0);   // cascaded from source
    expect(after.redemptions).toHaveLength(0); // cascaded from benefit
    // Members and points_sources should be untouched
    expect(after.members).toHaveLength(2);
    expect(after.pointsSources).toHaveLength(1);
    expect(after.redeemables).toHaveLength(1);
  });
});

// -- CASCADE delete from member -----------------------------------------------

describe('CASCADE — member delete propagates to sources, points_sources, redemptions', () => {
  it('deleting member m1 cascades through all dependent rows', async () => {
    await seedFullGraph(db);

    // Delete member m1 (owns source s1 → benefit b1 → redemptions r1,r2; owns points_source ps1 → redeemable rd1; also referenced by redemptions)
    await db.exec("DELETE FROM members WHERE id = 'm1'");

    const after = await readAll(db);
    // m1 deleted, m2 remains
    expect(after.members).toHaveLength(1);
    expect(after.members[0].id).toBe('m2');
    // source s1 was owned by m1 → cascaded
    expect(after.sources).toHaveLength(0);
    // benefit b1 was under s1 → cascaded
    expect(after.benefits).toHaveLength(0);
    // redemptions r1 (member_id=m1) and r2 (benefit_id=b1 cascaded from benefit) → all gone
    expect(after.redemptions).toHaveLength(0);
    // points_source ps1 was owned by m1 → cascaded
    expect(after.pointsSources).toHaveLength(0);
    // redeemable rd1 was under ps1 → cascaded
    expect(after.redeemables).toHaveLength(0);
  });

  it('deleting member m2 only removes m2 and their redemptions', async () => {
    await seedFullGraph(db);

    await db.exec("DELETE FROM members WHERE id = 'm2'");

    const after = await readAll(db);
    expect(after.members).toHaveLength(1);
    expect(after.members[0].id).toBe('m1');
    // m2 only had redemption r2 via member_id FK
    // r2 has benefit_id=b1 (still valid) AND member_id=m2 (deleted) → CASCADE from member deletes r2
    expect(after.redemptions).toHaveLength(1);
    expect(after.redemptions[0].id).toBe('r1');
    // Everything else untouched
    expect(after.sources).toHaveLength(1);
    expect(after.benefits).toHaveLength(1);
    expect(after.pointsSources).toHaveLength(1);
    expect(after.redeemables).toHaveLength(1);
  });
});

// -- writeAll bulk replace — no orphan rows -----------------------------------

describe('writeAll — bulk replace leaves no orphan rows', () => {
  it('replacing full dataset leaves no orphan FK references', async () => {
    await seedFullGraph(db);

    // Write a completely different dataset
    const newDataset: Dataset = {
      members: [
        { id: 'mx', name: 'Charlie', relationship: 'child', avatar: null, createdAt: '2025-01-01T00:00:00.000Z' },
      ],
      sources: [
        {
          id: 'sx', memberId: 'mx', name: 'Visa Plat', website: null, icon: null, phone: null,
          category: 'credit-card', currency: 'USD',
          cycleAnchor: { period: 'monthly', anchor: 15 },
          validFrom: null, validUntil: null,
          archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    await writeAll(db, newDataset);

    const after = await readAll(db);
    expect(after.members).toHaveLength(1);
    expect(after.members[0].id).toBe('mx');
    expect(after.sources).toHaveLength(1);
    expect(after.sources[0].id).toBe('sx');
    expect(after.sources[0].memberId).toBe('mx');
    // No orphan rows from old dataset
    expect(after.benefits).toHaveLength(0);
    expect(after.redemptions).toHaveLength(0);
    expect(after.pointsSources).toHaveLength(0);
    expect(after.redeemables).toHaveLength(0);

    // Verify FK integrity: the source's member_id points to an existing member
    const fkCheck = await db.prepare(
      "SELECT s.id FROM sources s LEFT JOIN members m ON s.member_id = m.id WHERE m.id IS NULL",
    ).all();
    expect(fkCheck.results).toHaveLength(0);
  });
});
