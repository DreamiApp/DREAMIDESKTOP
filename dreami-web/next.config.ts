// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/waitlist", destination: "/", permanent: true },
      { source: "/waitlist/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
