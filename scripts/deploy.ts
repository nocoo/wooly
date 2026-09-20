import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
if (process.env.CLOUDFLARE_ENV || process.env.WOOLY_TEST_STATE) {
  throw new Error("Deploy requires the production environment");
}
if (
  config.name !== "wooly-web" ||
  config.vars.ENVIRONMENT !== "production" ||
  config.vars.ALLOW_RESET !== "false" ||
  config.vars.LOCAL_USER_EMAIL ||
  config.vars.CF_ACCESS_TEAM_DOMAIN !== "nocoo" ||
  config.vars.CF_ACCESS_AUD !== "733fc16e1ebab2704e6d1a878403d805255f7e16f0b492bf3955cf053af354d9" ||
  config.d1_databases[0]?.database_id !== "363acd01-4b0d-4826-ab43-fc1293a1c986" ||
  config.workers_dev !== false || config.preview_urls !== false
) {
  throw new Error("Production Worker, Access and D1 configuration must match the approved deployment");
}

for (const args of [["run", "build"], ["x", "wrangler", "deploy", "--tag", `v${version}`]]) {
  const result = spawnSync("bun", args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
