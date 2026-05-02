/**
 * L2 route tests — POST /api/data/reset.
 *
 * Strategy: import the real Next.js route handler and mock global.fetch
 * so the full chain (route → worker-client → fetch) is exercised.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/data/reset/route";

// ---------------------------------------------------------------------------
// Env + fetch mock setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.WOOLY_WORKER_URL = "https://worker.test";
  process.env.WOOLY_API_KEY = "test-key";
  process.env.WOOLY_ALLOW_RESET = "true";
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.WOOLY_WORKER_URL;
  delete process.env.WOOLY_API_KEY;
  delete process.env.WOOLY_ALLOW_RESET;
});

// ---------------------------------------------------------------------------
// POST /api/data/reset
// ---------------------------------------------------------------------------

describe("POST /api/data/reset", () => {
  it("returns 200 with { ok: true } on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("sends POST to Worker /api/v1/dataset/reset with x-api-key", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    await POST(req);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://worker.test/api/v1/dataset/reset");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
  });

  it("returns 503 when Worker is not configured", async () => {
    delete process.env.WOOLY_WORKER_URL;

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("not configured");
  });

  it("returns 403 when WOOLY_ALLOW_RESET is not set", async () => {
    delete process.env.WOOLY_ALLOW_RESET;

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("WOOLY_ALLOW_RESET");
  });

  it("returns 403 when WOOLY_ALLOW_RESET is 'false'", async () => {
    process.env.WOOLY_ALLOW_RESET = "false";

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("forwards Worker 403 FORBIDDEN (Worker-side ALLOW_RESET disabled)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Reset is disabled" } }),
        { status: 403 },
      ),
    );

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("forwards Worker 500 on internal error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "DB error" } }),
        { status: 500 },
      ),
    );

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("returns 503 on network failure (Worker unreachable)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed"),
    );

    const req = new NextRequest("https://site.test/api/data/reset", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(503);
  });
});
