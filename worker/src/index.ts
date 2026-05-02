/**
 * wooly-worker — Cloudflare Worker for Wooly dataset API.
 *
 * Provides authenticated CRUD access to the Wooly D1 database.
 * Docker site calls these endpoints server-side via API_KEY.
 *
 * Routes:
 *   GET  /api/v1/health   — health check (no auth)
 *   GET  /api/v1/dataset  — read full dataset (auth required)
 *   PUT  /api/v1/dataset  — replace full dataset (auth required)
 *   POST /api/v1/dataset/reset — reset database (auth + ALLOW_RESET)
 */

import type { Env } from './types.js';
import { errorJson } from './errors.js';
import {
  handleGetDataset,
  handlePutDataset,
  handleResetDataset,
} from './routes/dataset.js';

async function handleFetch(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  // GET /api/v1/health — no auth required
  if (method === 'GET' && pathname === '/api/v1/health') {
    return Response.json({ status: 'ok' });
  }

  // GET /api/v1/dataset — read full dataset
  if (method === 'GET' && pathname === '/api/v1/dataset') {
    return handleGetDataset(request, env);
  }

  // PUT /api/v1/dataset — replace full dataset
  if (method === 'PUT' && pathname === '/api/v1/dataset') {
    return handlePutDataset(request, env);
  }

  // POST /api/v1/dataset/reset — clear database
  if (method === 'POST' && pathname === '/api/v1/dataset/reset') {
    return handleResetDataset(request, env);
  }

  // Fallback — 404 for unknown routes
  return errorJson('NOT_FOUND', `No route: ${method} ${pathname}`, 404);
}

export default {
  fetch: handleFetch,
} satisfies ExportedHandler<Env>;
