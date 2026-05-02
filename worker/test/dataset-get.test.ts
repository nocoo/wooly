import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { readAll, resetAll, writeAll } from '../src/db/operations.js';
import { applyMigration } from '../src/db/migrate.js';
import type { Dataset } from '../src/types.js';

// -- Real D1 tests via Miniflare ----------------------------------------------

let mf: Miniflare;
let db: D1Database;

beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok") } }',
    d1Databases: ['DB'],
  });
  db = await mf.getD1Database('DB');

  // Apply migration
  const sql = readFileSync(
    new URL('../migrations/0001_init.sql', import.meta.url),
    'utf-8',
  );
  await applyMigration(db, sql);
});

afterAll(async () => {
  await mf.dispose();
});

describe('readAll — real D1', () => {
  it('returns empty dataset from fresh database', async () => {
    const dataset = await readAll(db);

    expect(dataset.members).toEqual([]);
    expect(dataset.sources).toEqual([]);
    expect(dataset.benefits).toEqual([]);
    expect(dataset.redemptions).toEqual([]);
    expect(dataset.pointsSources).toEqual([]);
    expect(dataset.redeemables).toEqual([]);
    expect(dataset.defaultSettings).toEqual({ timezone: 'Asia/Shanghai' });
  });

  it('returns correct camelCase data after inserting rows', async () => {
    // Insert test data using raw SQL (snake_case)
    await db.exec(
      "INSERT INTO members (id, name, relationship, avatar, created_at) VALUES ('m1', 'Alice', 'self', NULL, 1700000000000);",
    );
    await db.exec(
      `INSERT INTO sources (id, member_id, name, website, icon, phone, category, currency, cycle_anchor, valid_from, valid_until, archived, memo, cost, card_number, color_index, created_at) VALUES ('s1', 'm1', 'AMEX Gold', 'https://amex.com', NULL, '400-100', 'credit-card', 'CNY', '{"period":"monthly","anchor":1}', 1700000000000, NULL, 0, 'primary', '600/y', '1234', 3, 1700000000000);`,
    );
    await db.exec(
      `INSERT INTO benefits (id, source_id, name, type, quota, credit_amount, shared, cycle_anchor, memo, created_at) VALUES ('b1', 's1', 'Lounge', 'quota', 4, NULL, 1, '{"period":"yearly","anchor":{"month":1,"day":1}}', NULL, 1700000000000);`,
    );
    await db.exec(
      "INSERT INTO redemptions (id, benefit_id, member_id, redeemed_at, memo) VALUES ('r1', 'b1', 'm1', 1700000000000, 'PVG T2');",
    );
    await db.exec(
      "INSERT INTO points_sources (id, member_id, name, icon, balance, memo, created_at) VALUES ('ps1', 'm1', 'MR Points', NULL, 50000, NULL, 1700000000000);",
    );
    await db.exec(
      "INSERT INTO redeemables (id, points_source_id, name, cost, memo, created_at) VALUES ('rd1', 'ps1', 'Flight', 20000, NULL, 1700000000000);",
    );
    await db.exec(
      "INSERT INTO settings (key, value) VALUES ('timezone', 'America/New_York');",
    );

    const dataset = await readAll(db);

    // Members
    expect(dataset.members).toHaveLength(1);
    expect(dataset.members[0].id).toBe('m1');
    expect(dataset.members[0].name).toBe('Alice');
    expect(dataset.members[0].createdAt).toBe('2023-11-14T22:13:20.000Z');
    expect(dataset.members[0].avatar).toBeNull();

    // Sources
    expect(dataset.sources).toHaveLength(1);
    expect(dataset.sources[0].memberId).toBe('m1'); // camelCase
    expect(dataset.sources[0].category).toBe('credit-card');
    expect(dataset.sources[0].cycleAnchor).toEqual({ period: 'monthly', anchor: 1 });
    expect(dataset.sources[0].validFrom).toBe('2023-11-14T22:13:20.000Z');
    expect(dataset.sources[0].validUntil).toBeNull();
    expect(dataset.sources[0].archived).toBe(false);
    expect(dataset.sources[0].cardNumber).toBe('1234');
    expect(dataset.sources[0].colorIndex).toBe(3);

    // Benefits
    expect(dataset.benefits).toHaveLength(1);
    expect(dataset.benefits[0].sourceId).toBe('s1');
    expect(dataset.benefits[0].shared).toBe(true);
    expect(dataset.benefits[0].cycleAnchor).toEqual({ period: 'yearly', anchor: { month: 1, day: 1 } });

    // Redemptions
    expect(dataset.redemptions).toHaveLength(1);
    expect(dataset.redemptions[0].benefitId).toBe('b1');
    expect(dataset.redemptions[0].memberId).toBe('m1');
    expect(dataset.redemptions[0].redeemedAt).toBe('2023-11-14T22:13:20.000Z');

    // Points sources
    expect(dataset.pointsSources).toHaveLength(1);
    expect(dataset.pointsSources[0].memberId).toBe('m1');
    expect(dataset.pointsSources[0].balance).toBe(50000);

    // Redeemables
    expect(dataset.redeemables).toHaveLength(1);
    expect(dataset.redeemables[0].pointsSourceId).toBe('ps1');

    // Settings
    expect(dataset.defaultSettings.timezone).toBe('America/New_York');
  });

  it('defaults timezone to Asia/Shanghai when settings table is empty', async () => {
    // Clean up for isolation
    await db.exec('DELETE FROM redeemables;');
    await db.exec('DELETE FROM points_sources;');
    await db.exec('DELETE FROM redemptions;');
    await db.exec('DELETE FROM benefits;');
    await db.exec('DELETE FROM sources;');
    await db.exec('DELETE FROM members;');
    await db.exec('DELETE FROM settings;');

    const dataset = await readAll(db);
    expect(dataset.defaultSettings.timezone).toBe('Asia/Shanghai');
  });
});

// -- readAll stable ordering --------------------------------------------------

describe('readAll — stable ordering by created_at/redeemed_at, id', () => {
  it('returns members ordered by created_at then id', async () => {
    // Clean slate
    await resetAll(db);

    // Insert out of chronological order: m3 (earliest), m1 (middle), m2 (latest)
    const dataset: Dataset = {
      members: [
        { id: 'm3', name: 'Charlie', relationship: 'child', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'm1', name: 'Alice', relationship: 'self', avatar: null, createdAt: '2024-06-01T00:00:00.000Z' },
        { id: 'm2', name: 'Bob', relationship: 'spouse', avatar: null, createdAt: '2024-12-01T00:00:00.000Z' },
      ],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    await writeAll(db, dataset);
    const result = await readAll(db);

    // Should be sorted by created_at ascending: m3, m1, m2
    expect(result.members.map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
  });

  it('breaks ties on created_at by id', async () => {
    await resetAll(db);

    // Two members with identical created_at — order by id
    const dataset: Dataset = {
      members: [
        { id: 'zz', name: 'Zara', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'aa', name: 'Abe', relationship: 'spouse', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
      ],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    await writeAll(db, dataset);
    const result = await readAll(db);

    // Same created_at → sorted by id: aa before zz
    expect(result.members.map((m) => m.id)).toEqual(['aa', 'zz']);
  });

  it('returns redemptions ordered by redeemed_at then id', async () => {
    await resetAll(db);

    const dataset: Dataset = {
      members: [
        { id: 'm1', name: 'Alice', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
      ],
      sources: [
        {
          id: 's1', memberId: 'm1', name: 'Card', website: null, icon: null, phone: null,
          category: 'credit-card', currency: 'CNY',
          cycleAnchor: { period: 'monthly', anchor: 1 },
          validFrom: null, validUntil: null,
          archived: false, memo: null, cost: null, cardNumber: null, colorIndex: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      benefits: [
        {
          id: 'b1', sourceId: 's1', name: 'Lounge', type: 'quota',
          quota: 4, creditAmount: null, shared: false,
          cycleAnchor: null, memo: null, createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      redemptions: [
        { id: 'r3', benefitId: 'b1', memberId: 'm1', redeemedAt: '2024-12-01T00:00:00.000Z', memo: null },
        { id: 'r1', benefitId: 'b1', memberId: 'm1', redeemedAt: '2024-01-01T00:00:00.000Z', memo: null },
        { id: 'r2', benefitId: 'b1', memberId: 'm1', redeemedAt: '2024-06-01T00:00:00.000Z', memo: null },
      ],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    await writeAll(db, dataset);
    const result = await readAll(db);

    // Should be sorted by redeemed_at ascending: r1, r2, r3
    expect(result.redemptions.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });
});

// -- Worker integration test (GET endpoint) -----------------------------------

describe('GET /api/v1/dataset — via Worker fetch', () => {
  let worker: { fetch: (request: Request, env: { DB: D1Database; API_KEY: string }) => Promise<Response> };

  beforeAll(async () => {
    const mod = await import('../src/index.js');
    worker = mod.default as unknown as typeof worker;
  });

  it('returns 401 without api key', async () => {
    const req = new Request('https://worker.test/api/v1/dataset');
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(401);
  });

  it('returns empty dataset with valid key', async () => {
    await resetAll(db); // ensure clean state after earlier tests
    const req = new Request('https://worker.test/api/v1/dataset', {
      headers: { 'x-api-key': 'secret' },
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(200);
    const body = await res.json() as { members: unknown[]; defaultSettings: { timezone: string } };
    expect(body.members).toEqual([]);
    expect(body.defaultSettings.timezone).toBe('Asia/Shanghai');
  });
});
