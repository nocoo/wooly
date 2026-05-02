// ---------------------------------------------------------------------------
// Dataset route handlers — GET and PUT /api/v1/dataset.
// ---------------------------------------------------------------------------

import type { Env } from '../types.js';
import { requireApiKey } from '../auth.js';
import { readAll } from '../db/operations.js';

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

  const dataset = await readAll(env.DB);
  return Response.json(dataset);
}
