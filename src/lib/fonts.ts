import {
  Outfit,
  DM_Sans,
  Space_Grotesk,
  Inter,
  Open_Sans,
  Roboto,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Bricolage_Grotesque,
} from "next/font/google";

/**
 * Self-hosted Google Fonts via next/font - eliminates CDN dependency,
 * enables automatic subsetting, and adds font-display: swap.
 *
 * Each font exports a className (for scoping) and a CSS variable.
 * The variables are applied to <html> so all existing CSS `font-family`
 * references continue to work via the browser's font matching.
 *
 * Preload strategy:
 *   - Outfit + Space Grotesk: preload (used by landing + login + global
 *     chrome — first-paint critical).
 *   - Other 6: preload: false (used only inside the builder / per-DS
 *     rendering surfaces). Their @font-face declarations are still
 *     emitted so the CSS variables resolve correctly when those routes
 *     render, but the browser doesn't <link rel="preload"> them on
 *     every route — saves ~200KB on landing LCP.
 */

export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-outfit",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
  preload: false,
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
  preload: false,
});

export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
  preload: false,
});

/* IBM Plex Sans - Carbon DS typeface. Loaded self-hosted via
   next/font so Carbon-themed pages render with Plex on first
   paint without a CDN round-trip. Weights match Carbon's
   productive + expressive scales: Light 300 for display
   headings, Regular 400 for body, SemiBold 600 for section
   headings. */
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
  preload: false,
});

/* IBM Plex Mono - used by Carbon for code snippets, token
   names, and data-grid monospace rows. */
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  preload: false,
});

/* Bricolage Grotesque - display face for the landing page.
   Variable across weight + width; we ship 500/700/800 so the page
   can dial weight without loading another file. */
export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
  variable: "--font-bricolage",
});

/** All font CSS variables joined for <html> className */
export const fontVariables = [
  outfit.variable,
  dmSans.variable,
  spaceGrotesk.variable,
  inter.variable,
  openSans.variable,
  roboto.variable,
  ibmPlexSans.variable,
  ibmPlexMono.variable,
  bricolageGrotesque.variable,
].join(" ");
