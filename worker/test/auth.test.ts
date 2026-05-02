import { describe, it, expect } from 'vitest';
import { requireApiKey } from '../src/auth.js';
import type { Env } from '../src/types.js';

function makeEnv(apiKey?: string): Env {
  return {
    DB: {} as D1Database,
    ...(apiKey !== undefined ? { API_KEY: apiKey } : {}),
  };
}

function makeRequest(headers?: Record<string, string>): Request {
  return new Request('https://worker.example.com/api/v1/dataset', {
    headers: headers ?? {},
  });
}

describe('requireApiKey', () => {
  it('returns null (pass) when key matches', () => {
    const env = makeEnv('test-key-123');
    const req = makeRequest({ 'x-api-key': 'test-key-123' });
    expect(requireApiKey(req, env)).toBeNull();
  });

  it('returns 500 when API_KEY is not configured (undefined)', async () => {
    const env = makeEnv(undefined);
    const req = makeRequest({ 'x-api-key': 'any' });
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(500);
    const body = await res!.json() as { error: { code: string } };
    expect(body.error.code).toBe('CONFIG_ERROR');
  });

  it('returns 500 when API_KEY is empty string', async () => {
    const env = makeEnv('');
    const req = makeRequest({ 'x-api-key': 'any' });
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(500);
    const body = await res!.json() as { error: { code: string } };
    expect(body.error.code).toBe('CONFIG_ERROR');
  });

  it('returns 401 when x-api-key header is missing', async () => {
    const env = makeEnv('valid-key');
    const req = makeRequest(); // no headers
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    const body = await res!.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when key does not match', async () => {
    const env = makeEnv('correct-key');
    const req = makeRequest({ 'x-api-key': 'wrong-key' });
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('returns 401 when x-api-key is empty string', async () => {
    const env = makeEnv('valid-key');
    const req = makeRequest({ 'x-api-key': '' });
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('does not accept Authorization header as x-api-key', async () => {
    const env = makeEnv('secret');
    const req = makeRequest({ Authorization: 'Bearer secret' });
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('is case-sensitive for key comparison', async () => {
    const env = makeEnv('CaseSensitive');
    const req = makeRequest({ 'x-api-key': 'casesensitive' });
    const res = requireApiKey(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });
});
