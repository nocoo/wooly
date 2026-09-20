import { version } from "../package.json";

const origin = "https://wooly.hexly.ai";
const response = await fetch(`${origin}/api/live`, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
if (response.status !== 200) throw new Error(`Health endpoint returned ${response.status}`);
const health = await response.json();
if (health.status !== "ok" || health.version !== version || health.storage !== "d1" || health.database?.connected !== true) {
  throw new Error("Deployed health, version or D1 connectivity does not match the release");
}
for (const path of ["/", "/api/data", "/api/session"]) {
  const result = await fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
  const location = result.headers.get("location");
  if (result.status !== 302 || !location || new URL(location).hostname !== "nocoo.cloudflareaccess.com") {
    throw new Error(`Access did not protect ${path}: ${result.status}`);
  }
}
console.log(`Verified Wooly v${version}: D1 connected; Access protects app and private APIs.`);
