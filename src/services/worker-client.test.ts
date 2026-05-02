import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Dataset } from "@/data/datasets";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal valid Dataset for request body assertions. */
const stubDataset: Dataset = {
  members: [],
  sources: [],
  benefits: [],
  redemptions: [],
  pointsSources: [],
  redeemables: [],
  defaultSettings: { timezone: "UTC" },
};

/** Worker error envelope JSON. */
function errorEnvelope(code: string, message: string) {
  return JSON.stringify({ error: { code, message } });
}

// ---------------------------------------------------------------------------
// Environment setup — import worker-client AFTER setting env vars
// ---------------------------------------------------------------------------

let fetchWorkerDataset: typeof import("@/services/worker-client").fetchWorkerDataset;
let syncWorkerDataset: typeof import("@/services/worker-client").syncWorkerDataset;
let resetWorkerDatabase: typeof import("@/services/worker-client").resetWorkerDatabase;
let isWorkerConfigured: typeof import("@/services/worker-client").isWorkerConfigured;
let WorkerRequestError: typeof import("@/services/worker-client").WorkerRequestError;
let WorkerUnavailableError: typeof import("@/services/worker-client").WorkerUnavailableError;

beforeEach(async () => {
  // Set env vars before each test to guarantee fresh state
  process.env.WOOLY_WORKER_URL = "https://worker.test";
  process.env.WOOLY_API_KEY = "test-secret-key";

  // Fresh import (vitest module cache is fine — env is read at call time)
  const mod = await import("@/services/worker-client");
  fetchWorkerDataset = mod.fetchWorkerDataset;
  syncWorkerDataset = mod.syncWorkerDataset;
  resetWorkerDatabase = mod.resetWorkerDatabase;
  isWorkerConfigured = mod.isWorkerConfigured;
  WorkerRequestError = mod.WorkerRequestError;
  WorkerUnavailableError = mod.WorkerUnavailableError;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.WOOLY_WORKER_URL;
  delete process.env.WOOLY_API_KEY;
});

// ---------------------------------------------------------------------------
// isWorkerConfigured
// ---------------------------------------------------------------------------

describe("isWorkerConfigured", () => {
  it("returns true when both env vars are set", () => {
    expect(isWorkerConfigured()).toBe(true);
  });

  it("returns false when WOOLY_WORKER_URL is missing", () => {
    delete process.env.WOOLY_WORKER_URL;
    expect(isWorkerConfigured()).toBe(false);
  });

  it("returns false when WOOLY_API_KEY is missing", () => {
    delete process.env.WOOLY_API_KEY;
    expect(isWorkerConfigured()).toBe(false);
  });

  it("returns false when both are missing", () => {
    delete process.env.WOOLY_WORKER_URL;
    delete process.env.WOOLY_API_KEY;
    expect(isWorkerConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchWorkerDataset — GET /api/v1/dataset
// ---------------------------------------------------------------------------

describe("fetchWorkerDataset", () => {
  it("sends GET with x-api-key header to correct URL", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    await fetchWorkerDataset();

    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://worker.test/api/v1/dataset");
    expect(init?.method).toBeUndefined(); // GET is default
    expect((init?.headers as Record<string, string>)["x-api-key"]).toBe("test-secret-key");
  });

  it("returns parsed Dataset on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    const result = await fetchWorkerDataset();
    expect(result.defaultSettings.timezone).toBe("UTC");
    expect(result.members).toEqual([]);
  });

  it("strips trailing slashes from WOOLY_WORKER_URL", async () => {
    process.env.WOOLY_WORKER_URL = "https://worker.test///";
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    await fetchWorkerDataset();
    expect((spy.mock.calls[0][0] as string)).toBe("https://worker.test/api/v1/dataset");
  });

  it("throws WorkerRequestError on 401 with error envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(errorEnvelope("UNAUTHORIZED", "Invalid API key"), {
        status: 401,
      }),
    );

    const err = await fetchWorkerDataset().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WorkerRequestError);
    const e = err as InstanceType<typeof WorkerRequestError>;
    expect(e.status).toBe(401);
    expect(e.code).toBe("UNAUTHORIZED");
    expect(e.message).toBe("Invalid API key");
    // API key must NOT appear in error
    expect(e.message).not.toContain("test-secret-key");
  });

  it("throws WorkerRequestError on 500 with non-JSON body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    await expect(fetchWorkerDataset()).rejects.toThrow(WorkerRequestError);
    try {
      await fetchWorkerDataset();
    } catch (err) {
      const e = err as InstanceType<typeof WorkerRequestError>;
      expect(e.status).toBe(500);
      expect(e.code).toBe("UNKNOWN");
    }
  });

  it("throws WorkerUnavailableError when config is missing", async () => {
    delete process.env.WOOLY_WORKER_URL;
    await expect(fetchWorkerDataset()).rejects.toThrow(WorkerUnavailableError);
  });

  it("throws WorkerUnavailableError on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed"),
    );

    await expect(fetchWorkerDataset()).rejects.toThrow(WorkerUnavailableError);
  });

  it("throws WorkerUnavailableError on timeout", async () => {
    const timeoutError = new DOMException("The operation was aborted", "TimeoutError");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(timeoutError);

    const err = await fetchWorkerDataset().catch((e: unknown) => e) as Error;
    expect(err).toBeInstanceOf(WorkerUnavailableError);
    expect(err.message).toContain("timed out");
  });
});

// ---------------------------------------------------------------------------
// syncWorkerDataset — PUT /api/v1/dataset
// ---------------------------------------------------------------------------

describe("syncWorkerDataset", () => {
  it("sends PUT with JSON body and x-api-key header", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(stubDataset), { status: 200 }),
    );

    await syncWorkerDataset(stubDataset);

    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://worker.test/api/v1/dataset");
    expect(init?.method).toBe("PUT");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect((init?.headers as Record<string, string>)["x-api-key"]).toBe("test-secret-key");
    expect(JSON.parse(init?.body as string)).toEqual(stubDataset);
  });

  it("returns the updated Dataset from Worker", async () => {
    const updated = { ...stubDataset, defaultSettings: { timezone: "America/New_York" } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(updated), { status: 200 }),
    );

    const result = await syncWorkerDataset(stubDataset);
    expect(result.defaultSettings.timezone).toBe("America/New_York");
  });

  it("throws WorkerRequestError on 400 validation failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        errorEnvelope("BAD_REQUEST", "Invalid ISO date in members[0].createdAt"),
        { status: 400 },
      ),
    );

    const err = await syncWorkerDataset(stubDataset).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WorkerRequestError);
    const e = err as InstanceType<typeof WorkerRequestError>;
    expect(e.status).toBe(400);
    expect(e.code).toBe("BAD_REQUEST");
  });
});

// ---------------------------------------------------------------------------
// resetWorkerDatabase — POST /api/v1/dataset/reset
// ---------------------------------------------------------------------------

describe("resetWorkerDatabase", () => {
  it("sends POST to /api/v1/dataset/reset with x-api-key", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await resetWorkerDatabase();

    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://worker.test/api/v1/dataset/reset");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["x-api-key"]).toBe("test-secret-key");
  });

  it("throws WorkerRequestError on 403 FORBIDDEN", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        errorEnvelope("FORBIDDEN", "Reset is disabled in this environment"),
        { status: 403 },
      ),
    );

    const err = await resetWorkerDatabase().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WorkerRequestError);
    const e = err as InstanceType<typeof WorkerRequestError>;
    expect(e.status).toBe(403);
    expect(e.code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// API key never leaks
// ---------------------------------------------------------------------------

describe("API key leak prevention", () => {
  it("WorkerRequestError never contains the API key", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        errorEnvelope("UNAUTHORIZED", "Invalid API key"),
        { status: 401 },
      ),
    );

    try {
      await fetchWorkerDataset();
    } catch (err) {
      const e = err as Error;
      expect(e.message).not.toContain("test-secret-key");
      expect(e.stack ?? "").not.toContain("test-secret-key");
      expect(JSON.stringify(e)).not.toContain("test-secret-key");
    }
  });

  it("WorkerUnavailableError never contains the API key", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed"),
    );

    try {
      await fetchWorkerDataset();
    } catch (err) {
      const e = err as Error;
      expect(e.message).not.toContain("test-secret-key");
      expect(JSON.stringify(e)).not.toContain("test-secret-key");
    }
  });
});
