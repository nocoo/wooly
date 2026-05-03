// API route: POST /api/data/reset — reset the Worker database.
// Protected by both site-level WOOLY_ALLOW_RESET env and Worker-side ALLOW_RESET.

import { NextRequest, NextResponse } from "next/server";
import {
  resetWorkerDatabase,
  isWorkerConfigured,
  WorkerRequestError,
  WorkerUnavailableError,
} from "@/services/worker-client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  if (!isWorkerConfigured()) {
    return NextResponse.json(
      { error: "Worker not configured (WOOLY_WORKER_URL / WOOLY_API_KEY)" },
      { status: 503 },
    );
  }

  // Site-level gate — must opt in via WOOLY_ALLOW_RESET=true
  if (process.env.WOOLY_ALLOW_RESET !== "true") {
    return NextResponse.json(
      { error: "Reset is disabled on this site (WOOLY_ALLOW_RESET)" },
      { status: 403 },
    );
  }

  try {
    await resetWorkerDatabase();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkerRequestError) {
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

    console.error("[/api/data/reset] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
