import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  /* Tree-shake large packages that expose everything as top-level named
     exports. Without this, a barrel import (`import * as CarbonIcons from
     "@carbon/icons-react"`, or pulling a single component out of a DS
     barrel) drags the whole package into the builder bundle. Next 16
     rewrites each import to its per-export deep path at build time, so
     only the symbols actually used ship to the client. Listed packages
     are all confirmed dependencies (@salt-ds/icons + @fluentui/react-icons
     are NOT deps, so they are deliberately omitted). */
  experimental: {
    optimizePackageImports: [
      "@carbon/icons-react",
      "@salt-ds/core",
      "@mui/material",
      "@fluentui/react-components",
    ],
  },
  async redirects() {
    return [
      { source: "/landing-southleft", destination: "/", permanent: true },
      { source: "/landing", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
