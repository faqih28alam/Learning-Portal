import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // No "output: standalone" here — Vercel handles its own build
};

export default nextConfig;