import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // optimizePackageImports for bundle performance
    optimizePackageImports: ["lucide-react", "@tanstack/react-table"],
  },
};

export default nextConfig;
