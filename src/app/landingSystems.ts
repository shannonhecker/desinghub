/**
 * Landing: the five design systems and what each brings to the screen.
 *
 * These values describe the product, so they are pinned to it twice:
 *  - `font` and `corners` are the builder's own per-system tokens
 *    (--ds-font and --ds-radius in src/components/builder/builder.css; for
 *    Fluent, borderRadiusMedium from the official Fluent theme). A unit test
 *    reads those sources and fails on drift.
 *  - `buttons` says where a system's buttons are fully rounded regardless of
 *    that radius (Material 3). A unit test reads the builder's rule for the
 *    system's primary action and checks the button's corner in the capture.
 *  - `accent` is the fill of the primary button as the builder rendered it,
 *    per mode. A unit test finds that colour in the shipped capture.
 */
export type SystemId = "salt" | "md3" | "fluent" | "carbon" | "uoaui";
export type Mode = "light" | "dark";

export interface Accent {
  /** Plain colour name, for people. */
  name: string;
  /** The rendered fill. Shown as a swatch; never read aloud. */
  hex: string;
}

export interface SystemSpec {
  id: SystemId;
  /** The id the builder's own stylesheet uses for this system. */
  builderId: "salt" | "m3" | "fluent" | "carbon" | "uoaui";
  name: string;
  /** Tint for the tab underline on the dark page. */
  brand: string;
  font: string;
  corners: string;
  /** Set where the system's buttons are fully rounded whatever its corner
   *  radius is: the capture then shows a pill beside `corners`-radius fields
   *  and cards, and the legend says both. Pinned to the builder's own rule
   *  for the system's primary action and to the capture's pixels. */
  buttons?: "pill";
  accent: Record<Mode, Accent>;
  /** The system's own page surface in dark mode: the specimen sheet's ground. */
  surface: string;
}

export const SYSTEMS: readonly SystemSpec[] = [
  {
    id: "salt",
    builderId: "salt",
    name: "Salt DS",
    brand: "#5B9BD1",
    font: "Open Sans",
    corners: "4px",
    accent: { light: { name: "steel blue", hex: "#2670A9" }, dark: { name: "steel blue", hex: "#2670A9" } },
    surface: "#242526",
  },
  {
    id: "md3",
    builderId: "m3",
    name: "Material 3",
    brand: "#D0BCFF",
    font: "Roboto",
    corners: "12px",
    buttons: "pill",
    accent: { light: { name: "violet", hex: "#6750A4" }, dark: { name: "lilac", hex: "#D0BCFF" } },
    surface: "#121212",
  },
  {
    id: "fluent",
    builderId: "fluent",
    name: "Fluent 2",
    brand: "#479EF5",
    font: "Segoe UI",
    corners: "4px",
    accent: { light: { name: "blue", hex: "#0F6CBD" }, dark: { name: "deep blue", hex: "#115EA3" } },
    surface: "#292929",
  },
  {
    id: "carbon",
    builderId: "carbon",
    name: "Carbon",
    brand: "#78A9FF",
    font: "IBM Plex Sans",
    corners: "0px",
    accent: { light: { name: "blue", hex: "#0F62FE" }, dark: { name: "bright blue", hex: "#4589FF" } },
    surface: "#161616",
  },
  {
    id: "uoaui",
    builderId: "uoaui",
    name: "uoaui",
    brand: "#A78BFA",
    font: "Inter",
    corners: "12px",
    accent: { light: { name: "muted violet", hex: "#6B5AA8" }, dark: { name: "violet", hex: "#8A58C9" } },
    surface: "#0B1120",
  },
] as const;

export const specOf = (id: SystemId): SystemSpec =>
  SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0];

/** A system's shape in words: its corner radius, and its buttons where they
 *  are rounded differently ("12px corners, pill buttons"). */
export const cornerWords = (s: SystemSpec) =>
  `${s.corners === "0px" ? "square corners" : `${s.corners} corners`}${s.buttons === "pill" ? ", pill buttons" : ""}`;

/** One side's facts as a plain phrase, with no hex in it. */
export function traits(s: SystemSpec, mode: Mode): string {
  return `${s.font}, ${cornerWords(s)}, ${s.accent[mode].name} accent`;
}

/** What actually differs between two systems, in words. Only real
    differences are named: Salt and Fluent share 4px corners, so corners are
    left out for that pair. No hex digits: this sentence is read aloud. */
export function differences(a: SystemSpec, b: SystemSpec, mode: Mode): string {
  const parts = [`${a.font} against ${b.font}`];
  if (cornerWords(a) !== cornerWords(b)) parts.push(`${cornerWords(a)} against ${cornerWords(b)}`);
  if (a.accent[mode].hex !== b.accent[mode].hex) {
    parts.push(`${a.accent[mode].name} against ${b.accent[mode].name}`);
  }
  return parts.join(", ");
}
