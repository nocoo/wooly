import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { version } from "../../package.json";
import { ISSUER, TEST_AUD, type AccessJwtKit } from "./access-jwt.js";
import { accessJwtKit, createIsolatedWorker, emptyDataset } from "./http-worker.js";

describe("L2 Access JWT and session over real HTTP", () => {
  let kit: AccessJwtKit;

  beforeAll(async () => {
    kit = await accessJwtKit();
  });

  it("GET /api/live is public and reports root version plus D1", async () => {
    const worker = await createIsolatedWorker();
    const res = await fetch(`${worker.origin}/api/live`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      version,
      storage: "d1",
      database: { connected: true },
    });
    await worker.close();
  });

  it("GET /api/session returns the explicit local test email with no-store", async () => {
    const worker = await createIsolatedWorker({
      LOCAL_USER_EMAIL: "test@example.test",
    });
    const res = await fetch(`${worker.origin}/api/session`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(await res.json()).toEqual({
      user: { email: "test@example.test", name: "test" },
    });
    await worker.close();
  });

  it("fails closed when LOCAL_USER_EMAIL is unset", async () => {
    const worker = await createIsolatedWorker({ LOCAL_USER_EMAIL: "" });
    const res = await fetch(`${worker.origin}/api/session`);
    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
    await worker.close();
  });

  it("accepts a verified Access JWT in production", async () => {
    const worker = await createIsolatedWorker({
      ENVIRONMENT: "production",
      ALLOW_RESET: "false",
    });
    const res = await fetch(`${worker.origin}/api/session`, {
      headers: { "cf-access-jwt-assertion": await kit.token() },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(await res.json()).toEqual({
      user: { email: "reader@example.com", name: "Reader" },
    });
    await worker.close();
  });

  it("rejects a forged JWT", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const signed = await kit.token();
    const pieces = signed.split(".");
    pieces[1] = btoa(
      JSON.stringify({
        email: "evil@example.com",
        sub: "evil",
        exp: Math.floor(Date.now() / 1000) + 100,
      }),
    );
    const res = await fetch(`${worker.origin}/api/session`, {
      headers: { "cf-access-jwt-assertion": pieces.join(".") },
    });
    expect(res.status).toBe(401);
    await worker.close();
  });

  it("rejects an expired JWT", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const expired = await new SignJWT({ email: "reader@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "local-key" })
      .setSubject("access-user")
      .setIssuedAt(1)
      .setExpirationTime(2)
      .setIssuer(ISSUER)
      .setAudience(TEST_AUD)
      .sign(kit.privateKey);
    const res = await fetch(`${worker.origin}/api/session`, {
      headers: { "cf-access-jwt-assertion": expired },
    });
    expect(res.status).toBe(401);
    await worker.close();
  });

  it("rejects a JWT with the wrong audience", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const res = await fetch(`${worker.origin}/api/session`, {
      headers: {
        "cf-access-jwt-assertion": await kit.token({}, ISSUER, "wrong-aud"),
      },
    });
    expect(res.status).toBe(401);
    await worker.close();
  });

  it("rejects missing JWT in production and never trusts the email header", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const res = await fetch(`${worker.origin}/api/session`, {
      headers: { "cf-access-authenticated-user-email": "reader@example.com" },
    });
    expect(res.status).toBe(401);
    await worker.close();
  });

  it("rejects cross-origin mutations and missing Origin", async () => {
    const worker = await createIsolatedWorker();
    const cross = await fetch(`${worker.origin}/api/data`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example.com",
      },
      body: JSON.stringify(emptyDataset),
    });
    expect(cross.status).toBe(403);
    const missing = await fetch(`${worker.origin}/api/data`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(emptyDataset),
    });
    expect(missing.status).toBe(403);
    await worker.close();
  });

  it("authenticates before serving ASSETS", async () => {
    const worker = await createIsolatedWorker({ ENVIRONMENT: "production" });
    const denied = await fetch(`${worker.origin}/`);
    expect(denied.status).toBe(401);
    await worker.close();
  });
});
