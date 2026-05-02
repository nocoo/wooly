// ---------------------------------------------------------------------------
// Unified error response envelope for wooly-worker.
//
// Success: existing Dataset or { ok: true }
// Failure: { error: { code, message } }
// ---------------------------------------------------------------------------

/**
 * Return a JSON error response with the standard envelope.
 *
 * @example errorJson('BAD_REQUEST', 'Invalid ISO date in members[0].createdAt', 400)
 * // → { error: { code: "BAD_REQUEST", message: "Invalid ISO date in members[0].createdAt" } }
 */
export function errorJson(
  code: string,
  message: string,
  status: number,
): Response {
  return Response.json({ error: { code, message } }, { status });
}

// Pre-defined error codes (extend as needed):
//   UNAUTHORIZED    — missing or invalid API key (401)
//   CONFIG_ERROR    — server-side misconfiguration, e.g. API_KEY not set (500)
//   FORBIDDEN       — action not allowed, e.g. reset in prod (403)
//   BAD_REQUEST     — invalid input (400)
//   NOT_FOUND       — unknown route or resource (404)
//   INTERNAL_ERROR  — unexpected server error (500)
