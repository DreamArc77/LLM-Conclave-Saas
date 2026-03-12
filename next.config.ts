import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_HASH: (process.env.RAILWAY_GIT_COMMIT_SHA ?? 'dev').slice(0, 7),
    // Explicitly inline Supabase public vars so they survive standalone Docker builds
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '',
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

export default nextConfig;
