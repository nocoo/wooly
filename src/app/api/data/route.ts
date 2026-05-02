// API route: GET /api/data — read full dataset, PUT /api/data — write full dataset.
// Delegates to the wooly-worker via the server-side Worker client.
// X-Data-Mode header is accepted for backward compatibility but ignored
// (data source selection is now controlled by the Worker/D1 deployment).

import { NextRequest, NextResponse } from "next/server";
import {
  fetchWorkerDataset,
  syncWorkerDataset,
  isWorkerConfigured,
  WorkerRequestError,
  WorkerUnavailableError,
} from "@/services/worker-client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
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
