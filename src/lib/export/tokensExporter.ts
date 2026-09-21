/**
 * tokensExporter - the active design system's OFFICIAL tokens as a
 * W3C Design Tokens (DTCG) JSON document.
 *
 * Design engineers hand tokens to Style Dictionary, Tokens Studio, Figma
 * Variables importers and their own build pipelines in this format. Until
 * now the only token surface the builder could hand off was CSS baked into
 * the Vite export. This module reads the same official sources the preview
 * and stylesheet export use, so the three agree:
 *
 *   - Salt   : `--salt-*` computed off @salt-ds/theme (curated characteristic
 *              set; browser-only — the values come from the loaded theme CSS)
 *   - Carbon : `--cds-*` from @carbon/themes for the active theme key
 *   - M3     : `--mui-*` from MUI's generated CSS-variables sheet (M3 baseline)
 *   - Fluent : `@fluentui/react-theme` web{Light,Dark}Theme
 *   - uoaui  : the in-house theme table (facsimile, marked as such)
 *
 * Output shape (https://tr.designtokens.org/format/):
 *   { "<group>": { "<name>": { "$type": "color", "$value": "#…",
 *                              "$extensions": { "com.designhub.cssVar": "--…" } } } }
 * Only values that map onto a DTCG type are emitted (color, dimension,
 * duration, number, fontFamily, fontWeight); composite values (shadows,
 * easing curves, gradients) are skipped rather than emitted as loose strings.
 */

import { getTheme } from "@/data/registry";
import {
  SALT_OFFICIAL_TOKENS,
  getCarbonOfficialTokens,
  readOfficialComputedTokens,
  TOKEN_SOURCE,
} from "@/lib/officialTokens";
import { buildM3TokenCSS } from "@/lib/officialM3FluentTokens";
import { webLightTheme, webDarkTheme } from "@fluentui/react-theme";
import { useBuilder } from "@/store/useBuilder";
import type { SystemId } from "@/lib/componentApiRegistry";

export type TokenType = "color" | "dimension" | "duration" | "number" | "fontFamily" | "fontWeight";

export interface DesignToken {
  $type: TokenType;
  $value: string | number;
  $extensions?: Record<string, unknown>;
}

export interface DesignTokensDocument {
  $description: string;
  $extensions: {
    "com.designhub": {
      system: SystemId;
      mode: "light" | "dark";
      themeKey: string;
      source: "official" | "facsimile";
      generatedAt: string;
      note?: string;
    };
  };
  [group: string]: unknown;
}

const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|transparent$|currentColor$)/;
const DIMENSION_RE = /^-?\d+(\.\d+)?(px|rem|em)$/;
const DURATION_RE = /^\d+(\.\d+)?m?s$/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

/** Classify a raw token value; null when it has no DTCG scalar type. */
export function classify(name: string, value: unknown): DesignToken | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { $type: /weight/i.test(name) ? "fontWeight" : "number", $value: value };
  }
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (/fontfamily/i.test(name)) return { $type: "fontFamily", $value: v };
  if (COLOR_RE.test(v)) return { $type: "color", $value: v };
  if (DIMENSION_RE.test(v)) return { $type: "dimension", $value: v };
  if (DURATION_RE.test(v)) return { $type: "duration", $value: v };
  if (NUMBER_RE.test(v)) {
    return { $type: /weight/i.test(name) ? "fontWeight" : "number", $value: Number(v) };
  }
  return null;
}

function withVar(token: DesignToken, cssVar: string): DesignToken {
  return { ...token, $extensions: { "com.designhub.cssVar": cssVar } };
}

/** `--cds-text-primary` → `text-primary`; `--mui-palette-primary-main` → `palette-primary-main`. */
function stripPrefix(cssVar: string, prefix: string): string {
  return cssVar.startsWith(prefix) ? cssVar.slice(prefix.length) : cssVar.replace(/^--/, "");
}

function fromVarMap(vars: Record<string, string>, prefix: string): Record<string, DesignToken> {
  const out: Record<string, DesignToken> = {};
  for (const [cssVar, value] of Object.entries(vars)) {
    const t = classify(cssVar, value);
    if (t) out[stripPrefix(cssVar, prefix)] = withVar(t, cssVar);
  }
  return out;
}

/** Parse one scoped block of buildM3TokenCSS() into a var map. */
function muiVarsFor(mode: "light" | "dark"): Record<string, string> {
  const css = buildM3TokenCSS();
  const selector = mode === "dark" ? ".preview-m3{" : ".builder-light .preview-m3{";
  const start = css.indexOf(selector);
  if (start === -1) return {};
  const body = css.slice(start + selector.length, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const decl of body.split(";")) {
    const i = decl.indexOf(":");
    if (i > 0) out[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
  }
  return out;
}

const UOAUI_CSS_VAR: Record<string, string> = {
  bg: "--a-bg",
  fg: "--a-fg",
  surface: "--a-surface",
  border: "--a-border",
  accent: "--a-accent",
};

/** Build the document for a system + mode (+ Carbon theme key). Pure except
 *  for Salt, whose official values are read off the loaded theme CSS. */
export function buildDesignTokens(
  system: SystemId,
  mode: "light" | "dark",
  themeKey: string,
  now: Date = new Date(),
): DesignTokensDocument {
  const label: Record<SystemId, string> = {
    salt: "Salt DS", m3: "Material 3 (MUI)", fluent: "Fluent 2", carbon: "Carbon DS", uoaui: "uoaui DS",
  };
  const doc: DesignTokensDocument = {
    $description: `${label[system]} design tokens (${mode}) exported from Design Hub`,
    $extensions: {
      "com.designhub": {
        system,
        mode,
        themeKey,
        source: TOKEN_SOURCE[system],
        generatedAt: now.toISOString(),
      },
    },
  };

  switch (system) {
    case "carbon": {
      const key = ["white", "g10", "g90", "g100"].includes(themeKey) ? themeKey : mode === "dark" ? "g100" : "white";
      doc.$extensions["com.designhub"].themeKey = key;
      doc.cds = fromVarMap(getCarbonOfficialTokens(key), "--cds-");
      break;
    }
    case "m3": {
      doc.mui = fromVarMap(muiVarsFor(mode), "--mui-");
      break;
    }
    case "fluent": {
      const theme = (mode === "dark" ? webDarkTheme : webLightTheme) as unknown as Record<string, unknown>;
      const group: Record<string, DesignToken> = {};
      for (const [key, value] of Object.entries(theme)) {
        const t = classify(key, value);
        if (t) group[key] = withVar(t, `--${key}`);
      }
      doc.fluent = group;
      break;
    }
    case "salt": {
      const names = SALT_OFFICIAL_TOKENS.flatMap((c) => c.tokens.map((t) => t.varName));
      const computed = readOfficialComputedTokens("salt", names, mode);
      const group = fromVarMap(computed, "--salt-");
      doc.salt = group;
      doc.$extensions["com.designhub"].note =
        Object.keys(group).length === 0
          ? "Salt values are read from @salt-ds/theme in the browser; export from the running builder to populate them."
          : "Curated Salt characteristic tokens (the full set ships in @salt-ds/theme).";
      break;
    }
    default: {
      const T = getTheme("uoaui", mode === "dark" ? "dark" : "light") as Record<string, unknown>;
      const group: Record<string, DesignToken> = {};
      for (const [key, value] of Object.entries(T)) {
        if (key === "name") continue;
        const t = classify(key, value);
        if (!t) continue;
        group[key] = UOAUI_CSS_VAR[key] ? withVar(t, UOAUI_CSS_VAR[key]) : t;
      }
      doc.a = group;
      doc.$extensions["com.designhub"].note = "uoaui is an in-house system; values are the builder's theme table.";
    }
  }
  return doc;
}

/** Serialised document for the active canvas. */
export function exportDesignTokens(): string {
  const s = useBuilder.getState();
  const doc = buildDesignTokens(
    s.designSystem as SystemId,
    s.mode === "dark" ? "dark" : "light",
    s.themeKey ?? "",
  );
  return JSON.stringify(doc, null, 2);
}

export function designTokensFilename(): string {
  const s = useBuilder.getState();
  return `design-tokens.${s.designSystem}.${s.mode === "dark" ? "dark" : "light"}.json`;
}
