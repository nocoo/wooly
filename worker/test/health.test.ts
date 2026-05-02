import { describe, it, expect, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

// Import the Worker default export
let worker: { fetch: (request: Request, env: Env) => Promise<Response> };

beforeEach(async () => {
  const mod = await import('../src/index.js');
  worker = mod.default as unknown as typeof worker;
});

function makeEnv(): Env {
  return {
    DB: {} as D1Database,
    API_KEY: 'test-key',
  };
}

function makeRequest(method: string, path: string, headers?: Record<string, string>): Request {
  return new Request(`https://worker.example.com${path}`, {
    method,
    headers: headers ?? {},
  });
}

describe('GET /api/v1/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await worker.fetch(makeRequest('GET', '/api/v1/health'), makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body).toEqual({ status: 'ok' });
  });

  it('does not require x-api-key', async () => {
    const env = makeEnv();
    delete env.API_KEY; // no key configured
    const res = await worker.fetch(makeRequest('GET', '/api/v1/health'), env);
    expect(res.status).toBe(200);
  });
});

describe('unknown routes', () => {
  it('returns 404 error envelope for unknown path', async () => {
    const res = await worker.fetch(makeRequest('GET', '/api/v1/unknown'), makeEnv());
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('/api/v1/unknown');
  });

  it('returns 404 for root path', async () => {
    const res = await worker.fetch(makeRequest('GET', '/'), makeEnv());
    expect(res.status).toBe(404);
  });

  it('returns 404 for POST to health endpoint', async () => {
    const res = await worker.fetch(makeRequest('POST', '/api/v1/health'), makeEnv());
    expect(res.status).toBe(404);
  });
});
