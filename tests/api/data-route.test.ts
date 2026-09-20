import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import {
  assertTestMarker,
  createIsolatedWorker,
  emptyDataset,
  testMarkerSql,
} from "./http-worker.js";

const memberDataset = {
  ...emptyDataset,
  members: [
    {
      id: "m1",
      name: "Alice",
      relationship: "self" as const,
      avatar: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  defaultSettings: { timezone: "America/New_York" },
};

describe("L2 GET/PUT /api/data over isolated Miniflare D1", () => {
  let origin = "";
  let db: D1Database;
  let marker = "";
  let persistDir = "";
  let close: () => Promise<void>;

  beforeAll(async () => {
    const worker = await createIsolatedWorker();
    origin = worker.origin;
    db = worker.db;
    marker = worker.marker;
    persistDir = worker.persistDir;
    close = worker.close;
  });

  beforeEach(async () => {
    await assertTestMarker(db, marker);
    const reset = await fetch(`${origin}/api/data/reset`, {
      method: "POST",
      headers: { origin },
    });
    expect(reset.status).toBe(200);
    await assertTestMarker(db, marker);
  });

  afterAll(async () => {
    await close();
  });

  it("GET returns the empty household dataset with no-store", async () => {
    const res = await fetch(`${origin}/api/data`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    const body = (await res.json()) as typeof emptyDataset;
    expect(body.members).toEqual([]);
    expect(body.defaultSettings.timezone).toBe("Asia/Shanghai");
  });

  it("PUT writes the full dataset atomically and GET reads it back", async () => {
    const put = await fetch(`${origin}/api/data`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(memberDataset),
    });
    expect(put.status).toBe(200);
    expect(put.headers.get("cache-control")).toMatch(/no-store/i);
    const written = (await put.json()) as typeof memberDataset;
    expect(written.members).toHaveLength(1);
    expect(written.defaultSettings.timezone).toBe("America/New_York");

    const get = await fetch(`${origin}/api/data`);
    expect(await get.json()).toEqual(written);
  });

  it("PUT rejects invalid JSON with 400 and leaves D1 unchanged", async () => {
    const seeded = await fetch(`${origin}/api/data`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(memberDataset),
    });
    expect(seeded.status).toBe(200);
    const res = await fetch(`${origin}/api/data`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin },
      body: "not-json",
    });
    expect(res.status).toBe(400);
    const current = (await (await fetch(`${origin}/api/data`)).json()) as typeof memberDataset;
    expect(current.members).toHaveLength(1);
  });

  it("returns JSON 404 for removed /api/v1 routes", async () => {
    const res = await fetch(`${origin}/api/v1/dataset`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns JSON 405 for the wrong method", async () => {
    const res = await fetch(`${origin}/api/data`, { method: "POST" });
    expect(res.status).toBe(405);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("keeps the synthetic marker after household reset and uses a temp SQLite dir", async () => {
    expect(existsSync(persistDir)).toBe(true);
    expect(testMarkerSql(marker).sql).toContain(marker);
    await assertTestMarker(db, marker);
  });
});
