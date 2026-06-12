/**
 * L2 route tests — GET /api/data, PUT /api/data.
 *
 * Strategy: import the real Next.js route handlers and mock global.fetch
 * so the full chain (route → worker-client → fetch) is exercised.
 * This catches env/header/error logic that mocking worker-client would miss.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Route handlers are imported after env setup — they read env at call time.
import { GET, PUT } from "@/app/api/data/route";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const stubDataset = {
  members: [],
  sources: [],
  benefits: [],
  redemptions: [],
  pointsSources: [],
  redeemables: [],
  defaultSettings: { timezone: "UTC" },
};

function workerErrorBody(code: string, message: string) {
  return JSON.stringify({ error: { code, message } });
}

// ---------------------------------------------------------------------------
// Env + fetch mock setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.WOOLY_WORKER_URL = "https://worker.test";
  process.env.WOOLY_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.WOOLY_WORKER_URL;
  delete process.env.WOOLY_API_KEY;
});

// ---------------------------------------------------------------------------
// GET /api/data
// ---------------------------------------------------------------------------

describe("GET /api/data", () => {
  it("returns 200 with dataset from Worker on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.defaultSettings.timezone).toBe("UTC");
    expect(body.members).toEqual([]);
  });

  it("sends x-api-key header to Worker", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    const req = new NextRequest("https://site.test/api/data");
    await GET(req);

    const [, init] = spy.mock.calls[0];
    expect((init?.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
  });

  it("returns 503 when Worker is not configured", async () => {
    delete process.env.WOOLY_WORKER_URL;

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("not configured");
  });

  it("forwards Worker 401 UNAUTHORIZED transparently", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(workerErrorBody("UNAUTHORIZED", "Invalid API key"), {
        status: 401,
      }),
    );

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("forwards Worker 500 INTERNAL_ERROR transparently", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(workerErrorBody("INTERNAL_ERROR", "DB crash"), {
        status: 500,
      }),
    );

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("returns 503 on network failure (Worker unreachable)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed"),
    );

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/data
// ---------------------------------------------------------------------------

describe("PUT /api/data", () => {
  it("returns 200 with updated dataset from Worker on success", async () => {
    const updated = { ...stubDataset, defaultSettings: { timezone: "America/New_York" } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(updated), { status: 200 }),
    );

    const req = new NextRequest("https://site.test/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stubDataset),
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.defaultSettings.timezone).toBe("America/New_York");
  });

  it("sends PUT with JSON body to Worker", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    const req = new NextRequest("https://site.test/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stubDataset),
    });
    await PUT(req);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://worker.test/api/v1/dataset");
    expect(init?.method).toBe("PUT");
    const sentBody = JSON.parse(init?.body as string);
    expect(sentBody.defaultSettings.timezone).toBe("UTC");
  });

  it("returns 503 when Worker is not configured", async () => {
    delete process.env.WOOLY_API_KEY;

    const req = new NextRequest("https://site.test/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stubDataset),
    });
    const res = await PUT(req);

    expect(res.status).toBe(503);
  });

  it("forwards Worker 400 BAD_REQUEST on validation failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        workerErrorBody("BAD_REQUEST", "Invalid ISO date"),
        { status: 400 },
      ),
    );

    const req = new NextRequest("https://site.test/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stubDataset),
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("does not leak API key in error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        workerErrorBody("UNAUTHORIZED", "Invalid API key"),
        { status: 401 },
      ),
    );

    const req = new NextRequest("https://site.test/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stubDataset),
    });
    const res = await PUT(req);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("test-key");
  });
});

// ---------------------------------------------------------------------------
// Visual mock mode (WOOLY_USE_MOCK)
// ---------------------------------------------------------------------------

describe("Visual mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WOOLY_USE_MOCK", "true");
    // Drop Worker env so the test fails loudly if mock branch falls through
    delete process.env.WOOLY_WORKER_URL;
    delete process.env.WOOLY_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("GET returns mock dataset (normal) without calling Worker", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.members.length).toBeGreaterThan(0);
    expect(body.sources.length).toBeGreaterThan(0);
  });

  it("GET returns empty dataset when ?_visual=empty", async () => {
    const req = new NextRequest("https://site.test/api/data?_visual=empty");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toEqual([]);
    expect(body.sources).toEqual([]);
    expect(body.defaultSettings.timezone).toBeTruthy();
  });

  it("PUT is a no-op in mock mode and returns the submitted dataset", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const req = new NextRequest("https://site.test/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stubDataset),
    });
    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.defaultSettings.timezone).toBe("UTC");
  });

  it("does NOT enable mock mode when NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    // No Worker configured + mock disabled by NODE_ENV → 503
    expect(res.status).toBe(503);
  });

  it("does NOT enable mock mode when WOOLY_USE_MOCK is missing", async () => {
    vi.stubEnv("WOOLY_USE_MOCK", "");

    const req = new NextRequest("https://site.test/api/data");
    const res = await GET(req);

    expect(res.status).toBe(503);
  });
});
