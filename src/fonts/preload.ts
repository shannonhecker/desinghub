/**
 * The font files worth fetching before the stylesheet asks for them: the
 * Latin faces of the three families the landing, the login and the builder
 * chrome paint first. Every other face (the design systems' own typefaces,
 * other scripts, the icon font) loads when a page draws with it.
 *
 * `new URL(..., import.meta.url)` makes the bundler emit the file and hand
 * back its hashed, cacheable address: the same address fonts.css resolves to.
 */
export const PRELOADED_FONTS: string[] = [
  new URL("./outfit/outfit-latin.woff2", import.meta.url).pathname,
  new URL("./space-grotesk/space-grotesk-latin.woff2", import.meta.url).pathname,
  new URL("./bricolage-grotesque/bricolage-grotesque-latin.woff2", import.meta.url).pathname,
];
