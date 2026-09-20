import { describe, expect, it } from "vitest";
import { accessJwtKit, createIsolatedWorker, emptyDataset } from "./http-worker.js";

const seed = {
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
};

describe("L2 POST /api/data/reset over isolated Miniflare D1", () => {
  it("clears D1 when test env allows reset", async () => {
    const worker = await createIsolatedWorker({ ALLOW_RESET: "true" });
    const put = await fetch(`${worker.origin}/api/data`, {
      method: "PUT",
      headers: { "content-type": "application/json", origin: worker.origin },
      body: JSON.stringify(seed),
    });
    expect(put.status).toBe(200);
    const res = await fetch(`${worker.origin}/api/data/reset`, {
      method: "POST",
      headers: { origin: worker.origin },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const after = (await (await fetch(`${worker.origin}/api/data`)).json()) as typeof seed;
    expect(after.members).toHaveLength(0);
    await worker.close();
  });

  it("returns 403 when ALLOW_RESET is not true", async () => {
    const worker = await createIsolatedWorker({ ALLOW_RESET: "false" });
    const res = await fetch(`${worker.origin}/api/data/reset`, {
      method: "POST",
      headers: { origin: worker.origin },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
    await worker.close();
  });

  it("returns 403 for unknown ENVIRONMENT even with ALLOW_RESET=true", async () => {
    const kit = await accessJwtKit();
    const worker = await createIsolatedWorker({
      ENVIRONMENT: "staging",
      ALLOW_RESET: "true",
    });
    const res = await fetch(`${worker.origin}/api/data/reset`, {
      method: "POST",
      headers: {
        origin: worker.origin,
        "cf-access-jwt-assertion": await kit.token(),
      },
    });
    expect(res.status).toBe(403);
    await worker.close();
  });

  it("never resets in production even with ALLOW_RESET=true and a valid JWT", async () => {
    const kit = await accessJwtKit();
    const worker = await createIsolatedWorker({
      ENVIRONMENT: "production",
      ALLOW_RESET: "true",
    });
    const put = await fetch(`${worker.origin}/api/data`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        origin: worker.origin,
        "cf-access-jwt-assertion": await kit.token(),
      },
      body: JSON.stringify(seed),
    });
    expect(put.status).toBe(200);
    const res = await fetch(`${worker.origin}/api/data/reset`, {
      method: "POST",
      headers: {
        origin: worker.origin,
        "cf-access-jwt-assertion": await kit.token(),
      },
    });
    expect(res.status).toBe(403);
    const after = (await (
      await fetch(`${worker.origin}/api/data`, {
        headers: { "cf-access-jwt-assertion": await kit.token() },
      })
    ).json()) as typeof seed;
    expect(after.members).toHaveLength(1);
    await worker.close();
  });
});
