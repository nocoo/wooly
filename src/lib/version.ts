/**
 * App version exposed to the UI.
 *
 * Read from package.json at module-load time. Next.js / Turbopack tree-shake
 * the import down to just the version string, so the full package.json
 * does not enter the client bundle. (Verified with `bun run build` —
 * resulting first-load JS does not contain other package.json fields.)
 *
 * Bump in package.json; this constant follows automatically. There's no
 * separate constants file to keep in sync.
 */
import pkg from "../../package.json" with { type: "json" };

export const APP_VERSION: string = pkg.version;
