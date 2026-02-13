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
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/index.ts",
        "src/models/types.ts",
        "src/hooks/use-theme.ts",
        "src/hooks/use-today.ts",
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
