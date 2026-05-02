// ---------------------------------------------------------------------------
// Dataset route handlers — GET, PUT /api/v1/dataset + POST reset.
// ---------------------------------------------------------------------------

import type { Env } from '../types.js';
import { requireApiKey } from '../auth.js';
import { errorJson } from '../errors.js';
import { validateDataset } from '../validator.js';
import { readAll, writeAll, resetAll } from '../db/operations.js';

/** Convert an unknown caught error into a 500 INTERNAL_ERROR response. */
function internalError(err: unknown): Response {
  const message = err instanceof Error ? err.message : 'Unknown error';
  return errorJson('INTERNAL_ERROR', message, 500);
}

/**
 * GET /api/v1/dataset — read the full dataset from D1.
 * Returns camelCase Dataset JSON matching src/data/datasets.ts.
 */
export async function handleGetDataset(
  request: Request,
  env: Env,
): Promise<Response> {
  const authError = requireApiKey(request, env);
  if (authError) return authError;

  try {
    const dataset = await readAll(env.DB);
    return Response.json(dataset);
  } catch (err) {
    return internalError(err);
  }
}

/**
 * PUT /api/v1/dataset — replace the full dataset in D1.
 *
 * Validate-first: the entire dataset is parsed and validated
 * (schema + cross-references) BEFORE any DB operations.
 * If validation fails, the DB is untouched.
 *
 * Returns the updated Dataset (re-read from DB after write).
 */
export async function handlePutDataset(
  request: Request,
  env: Env,
): Promise<Response> {
  const authError = requireApiKey(request, env);
  if (authError) return authError;

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson('BAD_REQUEST', 'Invalid JSON body', 400);
  }

  // Validate-first: check everything before touching DB
  const result = validateDataset(body);
  if (!result.ok) {
    return errorJson(
      'BAD_REQUEST',
      result.errors.join('; '),
      400,
    );
  }

  try {
    // Write to D1 atomically
    await writeAll(env.DB, result.data);

    // Re-read and return the updated dataset
    const updated = await readAll(env.DB);
    return Response.json(updated);
  } catch (err) {
    return internalError(err);
  }
}

/**
 * POST /api/v1/dataset/reset — clear all data from D1.
 *
 * Protected by:
 *   1. x-api-key authentication
 *   2. ALLOW_RESET env flag must be "true"
 *
 * Returns { ok: true } on success.
 */
export async function handleResetDataset(
  request: Request,
  env: Env,
): Promise<Response> {
  const authError = requireApiKey(request, env);
  if (authError) return authError;

  if (env.ALLOW_RESET !== 'true') {
    return errorJson('FORBIDDEN', 'Reset is disabled in this environment', 403);
  }

  try {
    await resetAll(env.DB);
    return Response.json({ ok: true });
  } catch (err) {
    return internalError(err);
  }
}
