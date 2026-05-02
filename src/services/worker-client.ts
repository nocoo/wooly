/**
 * Server-side Worker HTTP client for wooly-worker API.
 *
 * ⚠️  SERVER-ONLY — this module reads WOOLY_API_KEY from process.env.
 * Never import from client components or include in the client bundle.
 *
 * Provides typed wrappers around the Worker's REST endpoints:
 *   GET  /api/v1/dataset  → fetchWorkerDataset()
 *   PUT  /api/v1/dataset  → syncWorkerDataset(dataset)
 *   POST /api/v1/dataset/reset → resetWorkerDatabase()
 *
 * Design constraints:
 *   - No automatic retry (PUT is non-idempotent full replace).
 *   - 10 s request timeout via AbortSignal.
 *   - Worker error envelope { error: { code, message } } is preserved.
 *   - WOOLY_API_KEY is never included in any response or error object.
 */

import type { Dataset } from "@/data/datasets";

// -- Configuration -----------------------------------------------------------

const REQUEST_TIMEOUT_MS = 10_000;

interface WorkerConfig {
  url: string;
  apiKey: string;
}

/**
 * Read Worker credentials from process.env.
 * Returns null if either value is missing/empty.
 */
function getWorkerConfig(): WorkerConfig | null {
  const url = process.env.WOOLY_WORKER_URL;
  const apiKey = process.env.WOOLY_API_KEY;
  if (!url || !apiKey) return null;
  return { url: url.replace(/\/+$/, ""), apiKey };
}

/** Returns true if WOOLY_WORKER_URL and WOOLY_API_KEY are both set. */
export function isWorkerConfigured(): boolean {
  return getWorkerConfig() !== null;
}

// -- Error types -------------------------------------------------------------

/** Structured error from the Worker API. */
export interface WorkerError {
  /** HTTP status from the Worker (e.g. 400, 401, 500). */
  status: number;
  /** Error code from Worker envelope (e.g. "BAD_REQUEST", "UNAUTHORIZED"). */
  code: string;
  /** Human-readable error message. */
  message: string;
}

export class WorkerRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(error: WorkerError) {
    super(error.message);
    this.name = "WorkerRequestError";
    this.status = error.status;
    this.code = error.code;
  }
}

export class WorkerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkerUnavailableError";
  }
}

// -- Internal helpers --------------------------------------------------------

function requireConfig(): WorkerConfig {
  const config = getWorkerConfig();
  if (!config) {
    throw new WorkerUnavailableError(
      "Worker not configured: WOOLY_WORKER_URL and WOOLY_API_KEY must be set",
    );
  }
  return config;
}

/**
 * Make an authenticated request to the Worker API.
 * Handles timeout, HTTP errors, and Worker error envelope parsing.
 *
 * IMPORTANT: The API key is sent as x-api-key header only — it is never
 * included in error messages, logs, or thrown Error objects.
 */
async function workerFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const config = requireConfig();
  const url = `${config.url}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "x-api-key": config.apiKey,
        ...init.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new WorkerUnavailableError(
        `Worker request timed out after ${REQUEST_TIMEOUT_MS}ms`,
      );
    }
    // Network error (ECONNREFUSED, DNS failure, etc.)
    throw new WorkerUnavailableError(
      `Worker request failed: ${err instanceof Error ? err.message : "Unknown network error"}`,
    );
  }

  if (!response.ok) {
    // Try to parse Worker error envelope
    let code = "UNKNOWN";
    let message = `Worker returned ${response.status}`;
    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Non-JSON error body — keep defaults
    }
    throw new WorkerRequestError({ status: response.status, code, message });
  }

  return response;
}

// -- Public API --------------------------------------------------------------

/**
 * Fetch the full dataset from the Worker.
 * GET /api/v1/dataset
 */
export async function fetchWorkerDataset(): Promise<Dataset> {
  const response = await workerFetch("/api/v1/dataset");
  return (await response.json()) as Dataset;
}

/**
 * Replace the full dataset in the Worker.
 * PUT /api/v1/dataset
 *
 * Returns the updated dataset as confirmed by the Worker.
 */
export async function syncWorkerDataset(dataset: Dataset): Promise<Dataset> {
  const response = await workerFetch("/api/v1/dataset", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataset),
  });
  return (await response.json()) as Dataset;
}

/**
 * Reset the Worker database (clear all data).
 * POST /api/v1/dataset/reset
 *
 * Requires ALLOW_RESET=true on the Worker side.
 */
export async function resetWorkerDatabase(): Promise<void> {
  await workerFetch("/api/v1/dataset/reset", { method: "POST" });
}
