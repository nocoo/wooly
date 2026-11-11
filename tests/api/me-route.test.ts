import { beforeAll, describe, expect, it } from "vitest";
import { ISSUER, type AccessJwtKit } from "./access-jwt.js";
import { accessJwtKit, createIsolatedWorker } from "./http-worker.js";

describe("L2 GET /api/me with author profile", () => {
  let kit: AccessJwtKit;

  beforeAll(async () => {
    kit = await accessJwtKit();
  });

  it("returns verified user, authenticated flag, and no-store", async () => {
    const worker = await createIsolatedWorker({
      LOCAL_USER_EMAIL: "test@example.test",
    });
    const res = await fetch(`${worker.origin}/api/me`);
    expect(res.status).toBe(200);
    const cacheControl = res.headers.get("cache-control");
    expect(String(cacheControl)).toMatch(/no-store/i);
    const body = (await res.json()) as {
      email: string;
      name: string;
      avatar: string | null;
      authenticated: boolean;
    };
    expect(body).toMatchObject({
      email: "test@example.test",
      name: "test",
      authenticated: true,
    });
    expect(body.avatar === null || typeof body.avatar === "string").toBe(true);
    await worker.close();
  });

  it("returns JWT-backed identity for verified Access tokens in production", async () => {
    const worker = await createIsolatedWorker({
      ENVIRONMENT: "production",
      ALLOW_RESET: "false",
    });
    const res = await fetch(`${worker.origin}/api/me`, {
      headers: { "cf-access-jwt-assertion": await kit.token() },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      email: string;
      name: string;
      avatar: string | null;
      authenticated: boolean;
    };
    expect(body).toMatchObject({
      email: "reader@example.com",
      name: "Reader",
      authenticated: true,
    });
    expect(body.avatar === null || typeof body.avatar === "string").toBe(true);
    await worker.close();
  });

  it("rejects missing JWT in production", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const res = await fetch(`${worker.origin}/api/me`);
    expect(res.status).toBe(401);
    await worker.close();
  });

  it("rejects a JWT with the wrong audience", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const res = await fetch(`${worker.origin}/api/me`, {
      headers: {
        "cf-access-jwt-assertion": await kit.token({}, ISSUER, "wrong-aud"),
      },
    });
    expect(res.status).toBe(401);
    await worker.close();
  });
});
