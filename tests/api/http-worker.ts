import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { createAccessJwtKit, TEST_AUD } from "./access-jwt.js";

const migrationDir = fileURLToPath(new URL("../../worker/migrations/", import.meta.url));
const workerEntry = fileURLToPath(new URL("../../worker/src/index.ts", import.meta.url));
const MARKER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WorkerVars = {
  ENVIRONMENT?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  LOCAL_USER_EMAIL?: string;
  ALLOW_RESET?: string;
};

export function newTestRunId(): string {
  return crypto.randomUUID();
}

export function testMarkerSql(runId: string = newTestRunId()): { runId: string; sql: string } {
  if (!MARKER_ID.test(runId)) {
    throw new Error("invalid test marker id");
  }
  return {
    runId,
    sql: `CREATE TABLE IF NOT EXISTS _test_marker (id TEXT NOT NULL); INSERT INTO _test_marker (id) VALUES ('${runId}');`,
  };
}

export async function assertTestMarker(db: D1Database, runId: string): Promise<void> {
  const row = await db.prepare("SELECT id FROM _test_marker").first<{ id: string }>();
  if (row?.id !== runId) {
    throw new Error("Test database marker mismatch");
  }
}

export async function installTestMarker(
  db: D1Database,
  runId: string = newTestRunId(),
): Promise<string> {
  await db.exec("CREATE TABLE IF NOT EXISTS _test_marker (id TEXT NOT NULL);");
  await db.prepare("INSERT INTO _test_marker (id) VALUES (?)").bind(runId).run();
  await assertTestMarker(db, runId);
  return runId;
}

async function applySql(db: D1Database, sql: string): Promise<void> {
  const statements = sql
    .replace(/--.*$/gm, "")
    .split(";")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await db.exec(`${stmt};`);
  }
}

export async function migrateDb(db: D1Database): Promise<void> {
  await applySql(db, readFileSync(`${migrationDir}0001_init.sql`, "utf-8"));
  await applySql(db, readFileSync(`${migrationDir}0002_card_network.sql`, "utf-8"));
}

let bundledScript: Promise<string> | undefined;
let jwtKit: ReturnType<typeof createAccessJwtKit> | undefined;

export function accessJwtKit(): ReturnType<typeof createAccessJwtKit> {
  jwtKit ??= createAccessJwtKit();
  return jwtKit;
}

async function bundleWorker(): Promise<string> {
  bundledScript ??= esbuild
    .build({
      entryPoints: [workerEntry],
      bundle: true,
      write: false,
      format: "esm",
      platform: "neutral",
      target: "es2022",
      conditions: ["workerd", "worker", "browser"],
      loader: { ".json": "json" },
    })
    .then((result) => {
      const file = result.outputFiles[0];
      if (!file) throw new Error("esbuild produced no worker bundle");
      return file.text;
    });
  return bundledScript;
}

export type IsolatedWorker = {
  origin: string;
  db: D1Database;
  marker: string;
  persistDir: string;
  close: () => Promise<void>;
};

export async function createIsolatedWorker(vars: WorkerVars = {}): Promise<IsolatedWorker> {
  const persistDir = mkdtempSync(join(tmpdir(), "wooly-api-"));
  const kit = await accessJwtKit();
  const script = await bundleWorker();
  let mf: Miniflare | undefined;
  try {
    mf = new Miniflare(
      convertV4MiniflareOptions({
        host: "127.0.0.1",
        port: 0,
        logRequests: false,
        isolatedResourcePersistencePath: persistDir,
        modules: true,
        script,
        compatibilityDate: "2026-09-18",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        bindings: {
          ENVIRONMENT: "test",
          CF_ACCESS_TEAM_DOMAIN: "nocoo",
          CF_ACCESS_AUD: TEST_AUD,
          LOCAL_USER_EMAIL: "test@example.test",
          ALLOW_RESET: "true",
          ...vars,
        },
        serviceBindings: {
          ASSETS: async () =>
            new Response("<html>wooly</html>", {
              headers: { "content-type": "text/html" },
            }),
        },
        outboundService: async (request) => {
          if (String(request.url).includes("/cdn-cgi/access/certs")) {
            return kit.jwksResponse();
          }
          return new Response("blocked", { status: 503 });
        },
      }),
    );
    const origin = (await mf.ready).origin;
    const db = await mf.getD1Database("DB");
    await migrateDb(db);
    const marker = await installTestMarker(db);
    const miniflare = mf;
    return {
      origin,
      db,
      marker,
      persistDir,
      close: async () => {
        try {
          await assertTestMarker(db, marker);
        } finally {
          await miniflare.dispose();
          rmSync(persistDir, { recursive: true, force: true });
        }
      },
    };
  } catch (err) {
    await mf?.dispose().catch(() => undefined);
    rmSync(persistDir, { recursive: true, force: true });
    throw err;
  }
}

export const emptyDataset = {
  members: [],
  sources: [],
  benefits: [],
  redemptions: [],
  pointsSources: [],
  redeemables: [],
  defaultSettings: { timezone: "UTC" },
};
