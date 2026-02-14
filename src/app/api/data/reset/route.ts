// API route: POST /api/data/reset — reset database.
// Test mode: drop + recreate + reseed from mock data.
// Production mode: drop + recreate (empty).

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import type { DbMode } from "@/db";
import { resetAndSeed } from "@/db/operations";
import { getTestSeedData } from "@/db/seed";

function resolveMode(request: NextRequest): DbMode {
  const header = request.headers.get("X-Data-Mode");
  if (header === "production") return "production";
  return "test";
}

export async function POST(request: NextRequest) {
  try {
    const mode = resolveMode(request);
    const db = getDb(mode);
    const seedData = mode === "test" ? getTestSeedData() : undefined;
    resetAndSeed(db, seedData);
    return NextResponse.json({ ok: true, mode });
  } catch (error) {
    console.error("[POST /api/data/reset] Error:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 },
    );
  }
}
