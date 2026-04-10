import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow .jsx files in src/data
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
