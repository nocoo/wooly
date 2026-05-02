// ---------------------------------------------------------------------------
// API key authentication middleware for wooly-worker.
//
// All /api/v1/* data endpoints (except health) require x-api-key header.
// Missing or empty API_KEY in env is treated as a configuration error (500).
// ---------------------------------------------------------------------------

import type { Env } from './types.js';
import { errorJson } from './errors.js';

/**
 * Validate x-api-key header against env.API_KEY.
 *
 * Returns null if the key is valid (caller should proceed).
 * Returns an error Response if authentication fails.
 *
 * Error cases:
 *   - API_KEY not configured (undefined or empty) → 500 CONFIG_ERROR
 *   - Header missing → 401 UNAUTHORIZED
 *   - Header value incorrect → 401 UNAUTHORIZED
 *   - Header value is empty string → 401 UNAUTHORIZED
 */
export function requireApiKey(
  request: Request,
  env: Env,
): Response | null {
  // Server-side configuration check
  if (!env.API_KEY) {
    return errorJson(
      'CONFIG_ERROR',
      'API_KEY is not configured on the server',
      500,
    );
  }

  const provided = request.headers.get('x-api-key');

  if (!provided) {
    return errorJson('UNAUTHORIZED', 'Missing x-api-key header', 401);
  }

  if (provided !== env.API_KEY) {
    return errorJson('UNAUTHORIZED', 'Invalid API key', 401);
  }

  return null; // authenticated
}
