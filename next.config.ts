import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
/* Keep static rendering: Next's bootstrap and the five CSS-in-JS systems
   require inline scripts/styles. This is a baseline CSP, not an XSS cure.
   Restrict executable/network origins; never allow the browser to call the
   model API. External HTTPS images remain supported until the share-policy
   change in QA item 3. See docs/security-headers.md. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://vercel.live${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  "font-src 'self' https://vercel.live https://assets.vercel.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "frame-src https://vercel.live",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
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
  /* /ui-kit stays static in both forms. A link that carries a place
     (/ui-kit?c=buttons) is served by a second static page that waits for the
     place before drawing, so the plain /ui-kit HTML can contain its overview
     and a deep link still never shows it. beforeFiles: the rewrite has to win
     over the /ui-kit page itself. */
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/ui-kit", has: [{ type: "query", key: "c" }], destination: "/ui-kit/entry" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/landing-southleft", destination: "/", permanent: true },
      { source: "/landing", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
