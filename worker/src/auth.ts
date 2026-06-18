// ---------------------------------------------------------------------------
// API key authentication middleware for wooly-worker.
//
// All /api/v1/* data endpoints (except health) require x-api-key header.
// Missing or empty API_KEY in env is treated as a configuration error (500).
// ---------------------------------------------------------------------------

import type { Env } from './types.js';
import { errorJson } from './errors.js';

/**
 * Compare two strings in constant time to prevent timing attacks.
 * Uses crypto.subtle.timingSafeEqual (available in Cloudflare Workers runtime).
 * Length mismatch returns false without timing leak from byte comparison.
 */
async function secureCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  // Cloudflare Workers expose crypto.subtle.timingSafeEqual; Node/Vitest does not.
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (a: BufferSource, b: BufferSource) => boolean;
  };
  if (typeof subtle.timingSafeEqual === 'function') {
    return subtle.timingSafeEqual(bufA, bufB);
  }
  // Fallback constant-time comparison (XOR every byte, accumulate diff bits).
  let diff = 0;
  for (let i = 0; i < bufA.byteLength; i++) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return diff === 0;
}

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
export async function requireApiKey(
  request: Request,
  env: Env,
): Promise<Response | null> {
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

  if (!(await secureCompare(provided, env.API_KEY))) {
    return errorJson('UNAUTHORIZED', 'Invalid API key', 401);
  }

  return null; // authenticated
}
