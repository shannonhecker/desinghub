/**
 * Theme builder utilities - merge custom tokens with base themes,
 * validate contrast ratios, and serialize/deserialize theme JSON.
 */

import { contrastRatio, hexToRGB } from "./contrastUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ThemeTokens = Record<string, any>;

export interface TokenOverride {
  key: string;
  category: string;
  label: string;
  value: string;
  original: string;
}

/** Merge custom overrides into a base theme */
export function mergeTheme(base: ThemeTokens, overrides: Record<string, string>): ThemeTokens {
  return { ...base, ...overrides };
}

/** Group token keys by category for the editor UI */
export function categorizeTokens(theme: ThemeTokens): Record<string, { key: string; value: string }[]> {
  const cats: Record<string, { key: string; value: string }[]> = {
    Background: [],
    Foreground: [],
    Accent: [],
    Border: [],
    Status: [],
    Other: [],
  };

  for (const [key, value] of Object.entries(theme)) {
    if (typeof value !== "string") continue;
    const v = String(value);
    // Only include color-like values
    if (!v.startsWith("#") && !v.startsWith("rgb") && !v.startsWith("rgba") && !v.startsWith("linear-gradient")) continue;

    const kl = key.toLowerCase();
    /* "on" roles (onSurface, onPrimaryContainer, inverseOnSurface) are text
       colours. Test them first: their names contain "surface" / "primary",
       which used to file them under Background and Accent. */
    if (/^(on|inverseOn)[A-Z]/.test(key)) {
      cats.Foreground.push({ key, value: v });
    } else if (kl.includes("bg") || kl.includes("surface") || kl.includes("background")) {
      cats.Background.push({ key, value: v });
    } else if (kl.includes("fg") || kl.includes("text") || kl.includes("onsurface") || kl.includes("onprimary")) {
      cats.Foreground.push({ key, value: v });
    } else if (kl.includes("accent") || kl.includes("primary") || kl.includes("brand")) {
      cats.Accent.push({ key, value: v });
    } else if (kl.includes("border") || kl.includes("stroke") || kl.includes("outline") || kl.includes("divider")) {
      cats.Border.push({ key, value: v });
    } else if (kl.includes("positive") || kl.includes("negative") || kl.includes("caution") || kl.includes("info") || kl.includes("success") || kl.includes("error") || kl.includes("warning")) {
      cats.Status.push({ key, value: v });
    } else {
      cats.Other.push({ key, value: v });
    }
  }

  // Remove empty categories
  for (const k of Object.keys(cats)) {
    if (cats[k].length === 0) delete cats[k];
  }

  return cats;
}

/** Check contrast ratio between two hex colors */
export function checkContrast(fg: string, bg: string): { ratio: number; passAA: boolean; passAAA: boolean } | null {
  try {
    const fgRgb = hexToRGB(fg);
    const bgRgb = hexToRGB(bg);
    if (!fgRgb || !bgRgb) return null;
    const ratio = contrastRatio(fg, bg);
    return { ratio, passAA: ratio >= 4.5, passAAA: ratio >= 7 };
  } catch {
    return null;
  }
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The surface a token is meant to sit on, so its contrast is measured
 * against the right colour. A Material "on" role belongs to its container
 * (onPrimary on primary), an accent foreground to the accent, an inverse
 * foreground to the inverse background. Anything without a known partner is
 * measured against the page background.
 *
 * Returns the partner's token key, or null for "the page background".
 */
export function contrastPartner(key: string, theme: ThemeTokens): string | null {
  const has = (k: string) => typeof theme[k] === "string" && /^#[0-9a-fA-F]{3,6}$/.test(theme[k]);
  const candidates: string[] = [];
  const on = key.match(/^on([A-Z]\w*)$/);
  if (on) candidates.push(lowerFirst(on[1]));
  const inverseOn = key.match(/^inverseOn([A-Z]\w*)$/);
  if (inverseOn) candidates.push(`inverse${inverseOn[1]}`);
  if (key === "accentFg") candidates.push("accent");
  if (key === "fgOnBrand") candidates.push("brandBg");
  if (key === "fgInv") candidates.push("bgInv");
  if (key === "fgInverted") candidates.push("bgInverted");
  if (key === "textInverse") candidates.push("backgroundInverse");
  if (key === "textOnColor") candidates.push("accent", "backgroundBrand");
  /* Status text sits on its own tint: positiveFg on positiveWeak (Salt),
     dangerFg1 on dangerBg1 (Fluent), successFg on successBg (uoaui). */
  const statusFg = key.match(/^(positive|negative|caution|info)Fg$/);
  if (statusFg) candidates.push(`${statusFg[1]}Weak`);
  const numbered = key.match(/^(danger|success|warning)Fg(\d?)$/);
  if (numbered) candidates.push(`${numbered[1]}Bg${numbered[2]}`);
  return candidates.find(has) ?? null;
}

/** Serialize theme overrides to JSON */
export function exportThemeJSON(overrides: Record<string, string>, meta?: { ds: string; baseName: string }): string {
  return JSON.stringify({ meta, overrides }, null, 2);
}

/** Deserialize theme overrides from JSON */
export function importThemeJSON(json: string): { overrides: Record<string, string>; meta?: { ds: string; baseName: string } } | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.overrides === "object") {
      return { overrides: parsed.overrides, meta: parsed.meta };
    }
    return null;
  } catch {
    return null;
  }
}
