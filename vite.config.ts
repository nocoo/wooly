import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare({
    remoteBindings: false,
    inspectorPort: false,
    persistState: { path: process.env.WOOLY_TEST_STATE ?? ".wrangler/state" },
  })],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: 7014,
    strictPort: true,
    allowedHosts: ["wooly.dev.hexly.ai"],
  },
});
