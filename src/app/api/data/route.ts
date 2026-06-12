// API route: GET /api/data — read full dataset, PUT /api/data — write full dataset.
// Delegates to the wooly-worker via the server-side Worker client.

import { NextRequest, NextResponse } from "next/server";
import {
  fetchWorkerDataset,
  syncWorkerDataset,
  isWorkerConfigured,
  WorkerRequestError,
  WorkerUnavailableError,
} from "@/services/worker-client";

// Dev-only mock mode: when WOOLY_USE_MOCK=true (and not in production),
// short-circuit the Worker delegation and serve src/data/mock.ts.
// Used by the visual snapshot scaffold; never reachable in production
// because the NODE_ENV guard fails first.
// See docs/07-ui-design-audit.md §3.5.2 / §3.5.3.
function isVisualMockEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.WOOLY_USE_MOCK === "true"
  );
}

export async function GET(request: NextRequest) {
  if (isVisualMockEnabled()) {
    const state = request.nextUrl.searchParams.get("_visual") ?? "normal";
    if (state === "loading") {
      // Hold the response open so Playwright can screenshot the skeleton.
      // 60s is far longer than any reasonable screenshot window; the request
      // will be cancelled by the browser navigating away.
      await new Promise((r) => setTimeout(r, 60_000));
    }
    const { getDataset } = await import("@/data/datasets");
    return NextResponse.json(getDataset(state === "empty" ? "empty" : "normal"));
  }

  if (!isWorkerConfigured()) {
    return NextResponse.json(
      { error: "Worker not configured (WOOLY_WORKER_URL / WOOLY_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const dataset = await fetchWorkerDataset();
    return NextResponse.json(dataset);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  if (isVisualMockEnabled()) {
    // No-op: mock mode is read-only. Swallow writes so ViewModel debounced
    // sync never throws during a snapshot run.
    const dataset = await request.json();
    return NextResponse.json(dataset);
  }

  if (!isWorkerConfigured()) {
    return NextResponse.json(
      { error: "Worker not configured (WOOLY_WORKER_URL / WOOLY_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const dataset = await request.json();
    const updated = await syncWorkerDataset(dataset);
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// -- Error mapping -----------------------------------------------------------

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof WorkerRequestError) {
    // Transparently forward Worker error status and envelope
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof WorkerUnavailableError) {
    return NextResponse.json(
      { error: error.message },
      { status: 503 },
    );
  }

  console.error("[/api/data] Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
