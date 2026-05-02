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

// -- Test fixtures ------------------------------------------------------------

const fullDataset: Dataset = {
  members: [
    { id: 'm1', name: 'Alice', relationship: 'self', avatar: null, createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'm2', name: 'Bob', relationship: 'spouse', avatar: 'https://example.com/bob.png', createdAt: '2024-01-02T00:00:00.000Z' },
  ],
  sources: [
    {
      id: 's1', memberId: 'm1', name: 'AMEX Gold', website: 'https://amex.com', icon: null, phone: '400-100',
      category: 'credit-card', currency: 'CNY',
      cycleAnchor: { period: 'monthly', anchor: 1 },
      validFrom: '2024-01-01T00:00:00.000Z', validUntil: null,
      archived: false, memo: 'primary', cost: '600/y', cardNumber: '1234', colorIndex: 3,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  benefits: [
    {
      id: 'b1', sourceId: 's1', name: 'Airport Lounge', type: 'quota',
      quota: 4, creditAmount: null, shared: true,
      cycleAnchor: { period: 'yearly', anchor: { month: 1, day: 1 } },
      memo: null, createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  redemptions: [
    { id: 'r1', benefitId: 'b1', memberId: 'm1', redeemedAt: '2024-06-15T10:00:00.000Z', memo: 'PVG T2' },
  ],
  pointsSources: [
    { id: 'ps1', memberId: 'm1', name: 'MR Points', icon: null, balance: 50000, memo: null, createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  redeemables: [
    { id: 'rd1', pointsSourceId: 'ps1', name: 'Flight Upgrade', cost: 20000, memo: null, createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  defaultSettings: { timezone: 'America/New_York' },
};

// -- writeAll + readAll round-trip --------------------------------------------

describe('writeAll + readAll — real D1', () => {
  it('writes and reads back a full dataset correctly', async () => {
    await writeAll(db, fullDataset);
    const result = await readAll(db);

    expect(result.members).toHaveLength(2);
    expect(result.sources).toHaveLength(1);
    expect(result.benefits).toHaveLength(1);
    expect(result.redemptions).toHaveLength(1);
    expect(result.pointsSources).toHaveLength(1);
    expect(result.redeemables).toHaveLength(1);
    expect(result.defaultSettings.timezone).toBe('America/New_York');

    // Verify specific field mapping
    expect(result.members[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.sources[0].cycleAnchor).toEqual({ period: 'monthly', anchor: 1 });
    expect(result.sources[0].archived).toBe(false);
    expect(result.benefits[0].shared).toBe(true);
    expect(result.redemptions[0].redeemedAt).toBe('2024-06-15T10:00:00.000Z');
  });

  it('replaces existing data entirely on second write', async () => {
    // First write
    await writeAll(db, fullDataset);

    // Second write with different data
    const newDataset: Dataset = {
      members: [
        { id: 'mx', name: 'Charlie', relationship: 'child', avatar: null, createdAt: '2025-01-01T00:00:00.000Z' },
      ],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    await writeAll(db, newDataset);
    const result = await readAll(db);

    expect(result.members).toHaveLength(1);
    expect(result.members[0].id).toBe('mx');
    expect(result.sources).toHaveLength(0);
    expect(result.benefits).toHaveLength(0);
    expect(result.defaultSettings.timezone).toBe('UTC');
  });

  it('handles empty dataset write', async () => {
    // First write some data
    await writeAll(db, fullDataset);

    // Then write empty dataset
    const emptyDataset: Dataset = {
      members: [],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'Asia/Shanghai' },
    };
    await writeAll(db, emptyDataset);
    const result = await readAll(db);

    expect(result.members).toHaveLength(0);
    expect(result.sources).toHaveLength(0);
    expect(result.defaultSettings.timezone).toBe('Asia/Shanghai');
  });
});

// -- resetAll -----------------------------------------------------------------

describe('resetAll — real D1', () => {
  it('clears all data', async () => {
    await writeAll(db, fullDataset);
    await resetAll(db);
    const result = await readAll(db);

    expect(result.members).toHaveLength(0);
    expect(result.sources).toHaveLength(0);
    expect(result.defaultSettings.timezone).toBe('Asia/Shanghai'); // default
  });
});

// -- Worker PUT endpoint integration ------------------------------------------

describe('PUT /api/v1/dataset — via Worker fetch', () => {
  let worker: { fetch: (request: Request, env: { DB: D1Database; API_KEY: string }) => Promise<Response> };

  beforeAll(async () => {
    const mod = await import('../src/index.js');
    worker = mod.default as unknown as typeof worker;
  });

  it('returns 401 without api key', async () => {
    const req = new Request('https://worker.test/api/v1/dataset', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullDataset),
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('https://worker.test/api/v1/dataset', {
      method: 'PUT',
      headers: { 'x-api-key': 'secret', 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 400 for invalid dataset shape (missing fields)', async () => {
    const req = new Request('https://worker.test/api/v1/dataset', {
      method: 'PUT',
      headers: { 'x-api-key': 'secret', 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: [] }), // missing other fields
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid ISO date and does NOT touch DB', async () => {
    // Pre-populate with known data
    await writeAll(db, fullDataset);

    const badDataset = {
      ...fullDataset,
      members: [{ id: 'bad', name: 'Bad', relationship: 'self', avatar: null, createdAt: 'not-a-date' }],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
    };
    const req = new Request('https://worker.test/api/v1/dataset', {
      method: 'PUT',
      headers: { 'x-api-key': 'secret', 'Content-Type': 'application/json' },
      body: JSON.stringify(badDataset),
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(400);

    // Verify DB was NOT modified (validate-first guarantee)
    const current = await readAll(db);
    expect(current.members).toHaveLength(2); // original data intact
  });

  it('returns 200 with updated dataset on valid PUT', async () => {
    await resetAll(db);
    const req = new Request('https://worker.test/api/v1/dataset', {
      method: 'PUT',
      headers: { 'x-api-key': 'secret', 'Content-Type': 'application/json' },
      body: JSON.stringify(fullDataset),
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(200);
    const body = await res.json() as Dataset;
    expect(body.members).toHaveLength(2);
    expect(body.defaultSettings.timezone).toBe('America/New_York');
  });
});

// -- Worker reset endpoint integration ----------------------------------------

describe('POST /api/v1/dataset/reset — via Worker fetch', () => {
  let worker: { fetch: (request: Request, env: { DB: D1Database; API_KEY: string; ALLOW_RESET?: string }) => Promise<Response> };

  beforeAll(async () => {
    const mod = await import('../src/index.js');
    worker = mod.default as unknown as typeof worker;
  });

  it('returns 401 without api key', async () => {
    const req = new Request('https://worker.test/api/v1/dataset/reset', { method: 'POST' });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret', ALLOW_RESET: 'true' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when ALLOW_RESET is not set', async () => {
    const req = new Request('https://worker.test/api/v1/dataset/reset', {
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret' });
    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 when ALLOW_RESET is "false"', async () => {
    const req = new Request('https://worker.test/api/v1/dataset/reset', {
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret', ALLOW_RESET: 'false' });
    expect(res.status).toBe(403);
  });

  it('clears all data when ALLOW_RESET=true and key valid', async () => {
    await writeAll(db, fullDataset);
    const req = new Request('https://worker.test/api/v1/dataset/reset', {
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
    });
    const res = await worker.fetch(req, { DB: db, API_KEY: 'secret', ALLOW_RESET: 'true' });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body).toEqual({ ok: true });

    // Verify data is cleared
    const dataset = await readAll(db);
    expect(dataset.members).toHaveLength(0);
  });
});
