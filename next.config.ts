import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
