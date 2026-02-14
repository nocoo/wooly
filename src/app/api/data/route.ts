// API route: GET /api/data — read full dataset, PUT /api/data — write full dataset.
// Data mode is passed via X-Data-Mode header ("test" | "production").

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import type { DbMode } from "@/db";
import { readAll, writeAll } from "@/db/operations";
import { getTestSeedData } from "@/db/seed";

function resolveMode(request: NextRequest): DbMode {
  const header = request.headers.get("X-Data-Mode");
  if (header === "production") return "production";
  return "test";
}

/**
 * Ensure the test database is seeded on first read.
 * If the members table is empty (fresh db), auto-seed from mock data.
 */
function ensureTestSeeded(mode: DbMode): void {
  if (mode !== "test") return;
  const db = getDb(mode);
  const count = db.prepare("SELECT COUNT(*) as cnt FROM members").get() as { cnt: number };
  if (count.cnt === 0) {
    writeAll(db, getTestSeedData());
  }
}

export async function GET(request: NextRequest) {
  try {
    const mode = resolveMode(request);
    ensureTestSeeded(mode);
    const db = getDb(mode);
    const dataset = readAll(db);
    return NextResponse.json(dataset);
  } catch (error) {
    console.error("[GET /api/data] Error:", error);
    return NextResponse.json(
      { error: "Failed to read dataset" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const mode = resolveMode(request);
    const dataset = await request.json();
    const db = getDb(mode);
    writeAll(db, dataset);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/data] Error:", error);
    return NextResponse.json(
      { error: "Failed to write dataset" },
      { status: 500 },
    );
  }
}
