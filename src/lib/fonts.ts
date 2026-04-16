import {
  Outfit,
  DM_Sans,
  Space_Grotesk,
  Inter,
  Open_Sans,
  Roboto,
} from "next/font/google";

/**
 * Self-hosted Google Fonts via next/font — eliminates CDN dependency,
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

/** All font CSS variables joined for <html> className */
export const fontVariables = [
  outfit.variable,
  dmSans.variable,
  spaceGrotesk.variable,
  inter.variable,
  openSans.variable,
  roboto.variable,
].join(" ");
