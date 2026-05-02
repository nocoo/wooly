import { defineConfig } from "vitest/config";
import path from "path";

// Vitest config for L2 API route tests.
//
// Key differences from vitest.config.ts (L1):
// - Environment is 'node' not 'jsdom' — routes are server-side
// - No setupFiles — no DOM or testing-library setup
// - Includes tests/api/ only
// - No coverage collection (route coverage is L2, not L1)
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/api/**/*.test.ts"],
    testTimeout: 15_000,
    fileParallelism: true,
  },
});
