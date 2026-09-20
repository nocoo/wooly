import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const testConfig = config.env.test;
if (testConfig.vars.ENVIRONMENT !== "test" || testConfig.routes.length || testConfig.d1_databases[0].database_id !== "test-wooly") {
  throw new Error("Browser tests require isolated local bindings");
}
const state = mkdtempSync(join(tmpdir(), "wooly-browser-"));
const marker = crypto.randomUUID();
writeFileSync(join(state, "marker.sql"), `CREATE TABLE _test_marker (id TEXT NOT NULL); INSERT INTO _test_marker VALUES ('${marker}');`);
const env = { ...process.env, CLOUDFLARE_ENV: "test", WOOLY_TEST_STATE: state };
function database(...args: string[]) {
  const result = spawnSync("bun", ["x", "wrangler", "d1", ...args, "--local", "--env", "test", "--persist-to", state], { env, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
try {
  database("migrations", "apply", "DB");
  database("execute", "DB", "--file", join(state, "marker.sql"));
  const result = JSON.parse(database("execute", "DB", "--command", "SELECT id FROM _test_marker", "--json"));
  if (result[0]?.results[0]?.id !== marker) throw new Error("Test database marker mismatch");
  const child = spawn("bun", ["x", "vite", "--host", "127.0.0.1", "--port", "27014"], { env, stdio: "inherit" });
  const stop = () => child.kill("SIGTERM");
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  const code = await new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (value) => resolve(value ?? 0));
  });
  process.exitCode = code;
} finally {
  rmSync(state, { recursive: true, force: true });
}
