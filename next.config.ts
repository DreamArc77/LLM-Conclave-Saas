import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_HASH: (process.env.RAILWAY_GIT_COMMIT_SHA ?? 'dev').slice(0, 7),
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

export default nextConfig;
