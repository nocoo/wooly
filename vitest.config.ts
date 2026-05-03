import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // AST-aware remapping is the default in vitest v4+; no opt-in needed.
      reporter: ["text", "lcov"],
      // Only enforce coverage on Model, ViewModel, lib, and hooks layers.
      // View layer (components, pages, auth config, proxy) is excluded.
      include: [
        "src/models/**/*.ts",
        "src/viewmodels/**/*.ts",
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts",
        "src/data/**/*.ts",
      ],
      exclude: [
        // Test infrastructure — setup files and helpers, not production code.
        "src/test/**",
        // Test files themselves should not count toward coverage.
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        // Barrel re-export files contain no executable logic.
        "src/**/index.ts",
        // Pure type declarations — no runtime code to cover.
        "src/models/types.ts",
        // Thin browser-API wrappers (theme, date) — covered indirectly via integration.
        "src/hooks/use-theme.ts",
        "src/hooks/use-today.ts",
        // Shared data-loading hook — exercised through ViewModel tests, not directly.
        "src/hooks/use-dataset.ts",
        // Thin fetch wrapper around /api/data endpoints — better validated via E2E.
        "src/data/api.ts",
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
