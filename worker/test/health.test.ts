import { describe, it, expect, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';
import { version } from '../../package.json';

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

describe('health endpoints', () => {
  it.each(['/api/v1/health', '/api/live'])('returns the release version at %s', async (path) => {
    const res = await worker.fetch(makeRequest('GET', path), makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; version: string };
    expect(body).toEqual({ status: 'ok', version });
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
