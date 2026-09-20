import { describe, it, expect } from 'vitest';
import { brokenDb, fetchWorker, makeEnv } from './env.js';

describe('DB failure → 500 INTERNAL_ERROR envelope', () => {
  it('GET /api/data returns 500 with INTERNAL_ERROR on DB failure', async () => {
    const req = new Request('http://127.0.0.1/api/data');
    const res = await fetchWorker(req, makeEnv({ DB: brokenDb() }));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('D1_SIMULATED_FAILURE');
  });

  it('PUT /api/data returns 500 with INTERNAL_ERROR on DB write failure', async () => {
    const validDataset = {
      members: [],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { timezone: 'UTC' },
    };
    const req = new Request('http://127.0.0.1/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1' },
      body: JSON.stringify(validDataset),
    });
    const res = await fetchWorker(req, makeEnv({ DB: brokenDb() }));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('D1_SIMULATED_FAILURE');
  });

  it('POST /api/data/reset returns 500 with INTERNAL_ERROR on DB failure', async () => {
    const req = new Request('http://127.0.0.1/api/data/reset', {
      method: 'POST',
        headers: { Origin: 'http://127.0.0.1' },
    });
    const res = await fetchWorker(
      req,
      makeEnv({ DB: brokenDb(), ALLOW_RESET: 'true' }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('D1_SIMULATED_FAILURE');
  });

  it('normalizes non-Error database failures without exposing their value', async () => {
    const request = new Request('http://127.0.0.1/api/data');
    const response = await fetchWorker(
      request,
      makeEnv({ DB: brokenDb('private adapter failure detail') }),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unknown error' },
    });
  });
});
