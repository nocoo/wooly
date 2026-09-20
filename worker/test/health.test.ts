import { describe, it, expect } from 'vitest';
import { version } from '../../package.json';
import { failingDb, fetchWorker, makeEnv, mockAssets, stubDb } from './env.js';

function request(
  method: string,
  path: string,
  headers?: Record<string, string>,
  urlBase = 'http://127.0.0.1',
): Request {
  return new Request(`${urlBase}${path}`, { method, headers });
}

describe('GET /api/live', () => {
  it('returns version and D1 connectivity without auth', async () => {
    const res = await fetchWorker(request('GET', '/api/live'), makeEnv({ DB: stubDb() }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      status: 'ok',
      version,
      storage: 'd1',
      database: { connected: true },
    });
  });

  it('returns 503 when D1 is unavailable', async () => {
    const res = await fetchWorker(
      request('GET', '/api/live'),
      makeEnv({ DB: failingDb() }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'unavailable', version });
  });
});

describe('GET /api/session', () => {
  it('returns local user email and name', async () => {
    const res = await fetchWorker(
      request('GET', '/api/session'),
      makeEnv({ DB: stubDb() }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      user: { email: 'test@example.test', name: 'test' },
    });
  });
});

describe('API 404 and 405', () => {
  it('returns JSON 404 for unknown API routes including /api/v1', async () => {
    const res = await fetchWorker(
      request('GET', '/api/v1/dataset'),
      makeEnv({ DB: stubDb() }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('/api/v1/dataset');
  });

  it('returns JSON 405 for the wrong method on a known API route', async () => {
    const res = await fetchWorker(
      request('POST', '/api/live'),
      makeEnv({ DB: stubDb() }),
    );
    expect(res.status).toBe(405);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });
});

describe('ASSETS', () => {
  it('authenticates before ASSETS.fetch', async () => {
    let fetched = false;
    const res = await fetchWorker(
      request('GET', '/'),
      makeEnv({
        DB: stubDb(),
        ASSETS: mockAssets('<html>app</html>', () => {
          fetched = true;
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(fetched).toBe(true);
    expect(await res.text()).toBe('<html>app</html>');
  });

  it('does not fetch assets without identity', async () => {
    let fetched = false;
    const res = await fetchWorker(
      request('GET', '/', undefined, 'https://wooly.hexly.ai'),
      makeEnv({
        DB: stubDb(),
        ENVIRONMENT: 'production',
        ASSETS: mockAssets('spa', () => {
          fetched = true;
        }),
      }),
    );
    expect(res.status).toBe(401);
    expect(fetched).toBe(false);
  });
});
