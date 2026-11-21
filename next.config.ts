import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix Windows path issues with nft (Node File Tracing)
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // optimizePackageImports for bundle performance
    optimizePackageImports: ["lucide-react", "@tanstack/react-table"],
  },
};

export default nextConfig;
