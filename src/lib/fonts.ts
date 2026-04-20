import {
  Outfit,
  DM_Sans,
  Space_Grotesk,
  Inter,
  Open_Sans,
  Roboto,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";

/**
 * Self-hosted Google Fonts via next/font - eliminates CDN dependency,
 * enables automatic subsetting, and adds font-display: swap.
 *
 * Each font exports a className (for scoping) and a CSS variable.
 * The variables are applied to <html> so all existing CSS `font-family`
 * references continue to work via the browser's font matching.
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
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
});

export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
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
});

/* IBM Plex Mono - used by Carbon for code snippets, token
   names, and data-grid monospace rows. */
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
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
].join(" ");
