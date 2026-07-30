import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["wooly.dev.hexly.ai"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "favicon.im",
        pathname: "/**",
      },
    ],
  },
  // TypeScript 7.0 no longer ships lib/typescript.js (classic Compiler API).
  // Next reads that file to resolve tsconfig `paths` into webpack aliases;
  // without it, `@/*` fails to resolve at production build time. Register
  // the alias explicitly so the webpack build does not depend on the
  // missing Compiler API. Only takes effect when `next build --webpack` /
  // `next dev --webpack` is used; Turbopack has its own resolver.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    const alias = config.resolve.alias;
    if (Array.isArray(alias)) {
      config.resolve.alias = [...alias, { name: "@", alias: path.join(rootDir, "src") }];
    } else {
      config.resolve.alias = {
        ...(alias as Record<string, string | false | string[]> | undefined),
        "@": path.join(rootDir, "src"),
      };
    }
    return config;
  },
};

export default nextConfig;
