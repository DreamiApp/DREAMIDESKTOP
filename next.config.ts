import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },   // don't fail on ESLint errors
  // typescript: { ignoreBuildErrors: true }, // optional
};

export default nextConfig;
