import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { preload } from "react-dom";
import { PRELOADED_FONTS } from "@/fonts/preload";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, isPreviewDeployment, siteUrl } from "@/lib/site";
import { uoauiLandingSchemeVars } from "@/data/uoaui/tokens";
import "@/fonts/fonts.css";
import "./globals.css";
import "./conversion.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_TITLE} | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  /* The share image is src/app/opengraph-image.png (and twitter-image.png):
     Next adds its address, size and type. */
  openGraph: { type: "website", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  /* A preview deployment is never listed. */
  robots: isPreviewDeployment() ? { index: false, follow: false } : { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "uoaui",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e1a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /* Every font is served from this origin (src/fonts). The three faces the
     first paint of the landing, the login and the builder chrome draws with
     are fetched early; the rest load when a page uses them. */
  for (const href of PRELOADED_FONTS) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="en">
      <head>
        {/* uoaui DS "landing" scheme — Refined Aurora palette + editorial type
            families, emitted globally as --a-landing-* so marketing surfaces
            (landing, login) alias their --lsl-* layer onto the DS source.
            Separate from component THEMES → no ripple into builder/preview. */}
        <style id="uoaui-landing-scheme">{`:root{${uoauiLandingSchemeVars()}}`}</style>
      </head>
      <body>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
