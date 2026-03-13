import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
    },
  },
  output: "standalone",
};

export default nextConfig;
