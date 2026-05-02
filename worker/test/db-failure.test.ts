import { describe, it, expect, beforeAll } from 'vitest';

// -- Worker integration tests for DB failure → 500 INTERNAL_ERROR --------

describe('DB failure → 500 INTERNAL_ERROR envelope', () => {
  let worker: {
    fetch: (
      request: Request,
      env: { DB: D1Database; API_KEY: string; ALLOW_RESET?: string },
    ) => Promise<Response>;
  };

  beforeAll(async () => {
    const mod = await import('../src/index.js');
    worker = mod.default as unknown as typeof worker;
  });

  /** A fake D1Database whose every method rejects. */
  function brokenDb(): D1Database {
    const fail = () => {
      throw new Error('D1_SIMULATED_FAILURE');
    };
    return {
      prepare: () => ({
        bind: () => ({ all: fail, first: fail, run: fail, raw: fail }),
        all: fail,
        first: fail,
        run: fail,
        raw: fail,
      }),
      batch: fail,
      exec: fail,
      dump: fail,
    } as unknown as D1Database;
  }

  it('GET /api/v1/dataset returns 500 with INTERNAL_ERROR on DB failure', async () => {
    const req = new Request('https://worker.test/api/v1/dataset', {
      headers: { 'x-api-key': 'secret' },
    });
    const res = await worker.fetch(req, { DB: brokenDb(), API_KEY: 'secret' });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('D1_SIMULATED_FAILURE');
  });

  it('PUT /api/v1/dataset returns 500 with INTERNAL_ERROR on DB write failure', async () => {
    const validDataset = {
      members: [],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    const req = new Request('https://worker.test/api/v1/dataset', {
      method: 'PUT',
      headers: { 'x-api-key': 'secret', 'Content-Type': 'application/json' },
      body: JSON.stringify(validDataset),
    });
    const res = await worker.fetch(req, { DB: brokenDb(), API_KEY: 'secret' });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('D1_SIMULATED_FAILURE');
  });

  it('POST /api/v1/dataset/reset returns 500 with INTERNAL_ERROR on DB failure', async () => {
    const req = new Request('https://worker.test/api/v1/dataset/reset', {
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
    });
    const res = await worker.fetch(req, {
      DB: brokenDb(),
      API_KEY: 'secret',
      ALLOW_RESET: 'true',
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('D1_SIMULATED_FAILURE');
  });
});
