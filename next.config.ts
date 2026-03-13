import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10000mb'
    },
  },
  output: "standalone",
};

export default nextConfig;
