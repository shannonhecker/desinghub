import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  /* Tree-shake large icon packages that expose all icons as top-level
     named exports. Without this, `import * as CarbonIcons from
     "@carbon/icons-react"` in SimulatedUI and carbon-documentation
     pulls all 2,600+ Carbon icon components into the bundle.
     Next 16 rewrites the import to per-icon paths at build time so
     only the glyphs actually used ship to the client. */
  experimental: {
    optimizePackageImports: ["@carbon/icons-react"],
  },
};

export default nextConfig;
