import type { Env } from '../types.js';
import { errorJson } from '../errors.js';
import { validateDataset } from '../validator.js';
import { readAll, writeAll, resetAll } from '../db/operations.js';

function internalError(err: unknown): Response {
  const message = err instanceof Error ? err.message : 'Unknown error';
  return errorJson('INTERNAL_ERROR', message, 500);
}

export async function handleGetDataset(env: Env): Promise<Response> {
  try {
    const dataset = await readAll(env.DB);
    return Response.json(dataset);
  } catch (err) {
    return internalError(err);
  }
}

export async function handlePutDataset(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson('BAD_REQUEST', 'Invalid JSON body', 400);
  }

  const result = validateDataset(body);
  if (!result.ok) {
    return errorJson('BAD_REQUEST', result.errors.join('; '), 400);
  }

  try {
    await writeAll(env.DB, result.data);
    const updated = await readAll(env.DB);
    return Response.json(updated);
  } catch (err) {
    return internalError(err);
  }
}

export async function handleResetDataset(env: Env): Promise<Response> {
  if (!['local', 'test'].includes(env.ENVIRONMENT) || env.ALLOW_RESET !== 'true') {
    return errorJson(
      'FORBIDDEN',
      'Reset is disabled in this environment',
      403,
    );
  }

  try {
    await resetAll(env.DB);
    return Response.json({ ok: true });
  } catch (err) {
    return internalError(err);
  }
}
