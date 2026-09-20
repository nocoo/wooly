import type { Env } from '../src/types.js';
import worker from '../src/index.js';

export const TEST_AUD = 'test-audience';

export function mockAssets(body = 'spa', onFetch?: () => void): Env['ASSETS'] {
  return {
    fetch: async () => {
      onFetch?.();
      return new Response(body);
    },
  } as unknown as Env['ASSETS'];
}

export function stubDb(): Env['DB'] {
  return {
    prepare: () => ({
      first: async () => ({ '1': 1 }),
    }),
  } as unknown as Env['DB'];
}

export function failingDb(): Env['DB'] {
  return {
    prepare: () => ({
      first: async () => {
        throw new Error('no db');
      },
    }),
  } as unknown as Env['DB'];
}

export function brokenDb(
  failure: unknown = new Error('D1_SIMULATED_FAILURE'),
): Env['DB'] {
  const fail = () => {
    throw failure;
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
  } as unknown as Env['DB'];
}

export function makeEnv(overrides: Partial<Env> & Pick<Env, 'DB'>): Env {
  return {
    ASSETS: mockAssets(),
    ENVIRONMENT: 'test',
    CF_ACCESS_TEAM_DOMAIN: 'nocoo',
    CF_ACCESS_AUD: TEST_AUD,
    LOCAL_USER_EMAIL: 'test@example.test',
    ALLOW_RESET: 'true',
    ...overrides,
  };
}

export function fetchWorker(request: Request, env: Env): Promise<Response> {
  return worker.fetch(request, env);
}
