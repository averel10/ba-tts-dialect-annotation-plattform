import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
    },
  },
  output: "standalone",
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/public/:path*',
          destination: '/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
