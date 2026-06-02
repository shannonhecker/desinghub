"use client";

/**
 * RealComponentRenderer (#9 PR-3, extended W6-P2a) — renders REAL design-system
 * components in the /ui-kit "Builder Blocks" gallery (and the read-only builder
 * preview), so the kit is demonstrably "pulling from the official DS API" rather
 * than a facsimile.
 *
 * SCOPE (deliberately narrow + honest):
 *   - SYSTEMS:
 *       · Salt (SaltProvider), Material 3 (MUI ThemeProvider), Fluent
 *         (FluentProvider) — JS-provider DSs with NO global reset, rendered via
 *         their own provider subtree.
 *       · uoaui (W6-P2a) — className/CSS-only (no npm package): the in-house
 *         glassmorphism DS. Rendered via the UoauiReal subtree, which wraps the
 *         real `.a-*` markup (from realBlockMap) in `.preview-uoaui.a-app` and
 *         injects the DS's own CSS via the existing getFullCSS / uoauiBuildCSS
 *         theme mechanism — SCOPED to that wrapper so the DS's global reset
 *         (`*{}` / `:root{}`) can't leak app-wide.
 *       · Carbon (W6-P2b) — real `@carbon/react` components. @carbon/styles is a
 *         ~950 KB GLOBAL sheet (Eric-Meyer reset + `:root` token blocks), so
 *         it's scoped at BUILD TIME to `.carbon-live-scope`
 *         (scripts/generate-carbon-scoped-css.mjs -> public/carbon-scoped.css)
 *         and lazy-loaded by CarbonScopeStyles. The CarbonReal subtree wraps the
 *         real components (from realBlockMap) in a `.carbon-live-scope` element
 *         carrying the `cds--white`/`cds--g100` theme class (so --cds-* resolve
 *         inside the scope). Per the locked decision, Carbon's @keyframes land
 *         in the global keyframe registry (harmless, --cds-/IBM-Plex prefixed);
 *         Shadow DOM/iframe are NOT used (DnD-kit needs one document).
 *   - BLOCKS: only the CORE SET — Button, TextInput, Checkbox, Switch, Card.
 *     Everything else returns null and the caller falls back to the builder's
 *     ComponentRenderer (the same render path as the canvas).
 *
 * The prop translation mirrors src/lib/componentApiRegistry.ts (the JSX-string
 * exporter) in real React/markup: Salt sentiment/appearance, MUI variant/color,
 * Fluent appearance, uoaui `.a-*` classes — so what renders here matches the
 * handoff code the export emits.
 *
 * SSR SAFETY: this is a "use client" component, and the gallery that mounts it
 * is dynamic-imported with `ssr: false`. Belt-and-suspenders, the CALLER also
 * client-gates this behind a `mounted` flag (ComponentRenderer's `mountedReal`)
 * so MUI's emotion / Fluent's griffel style engines never run during SSR or the
 * first hydration pass — no Next App-Router hydration mismatch, and no
 * empty-demo flash. uoaui is plain CSS (no JS style engine), but it rides the
 * same mounted gate so its scoped <style> injects only client-side too. Carbon
 * (@carbon/react) uses Sass-compiled static CSS (no runtime style engine); it
 * rides the same mounted gate and lazy-loads its scoped sheet via
 * CarbonScopeStyles on first mount.
 *
 * We never import the GLOBAL `@carbon/styles` sheet; Carbon's CSS comes only via
 * the build-time-scoped public/carbon-scoped.css (lazy <link>).
 */

import React from "react";

import { getFullCSS, getTheme } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { getRealBlockRenderer } from "@/components/ui-kit/realBlockMap";
import { CarbonScopeStyles } from "@/components/ui-kit/CarbonScopeStyles";

import {
  SaltProvider,
  Button as SaltButton,
  FormField as SaltFormField,
  FormFieldLabel as SaltFormFieldLabel,
  Input as SaltInput,
  Checkbox as SaltCheckbox,
  Switch as SaltSwitch,
  Card as SaltCard,
} from "@salt-ds/core";

import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import MuiButton from "@mui/material/Button";
import MuiTextField from "@mui/material/TextField";
import MuiCheckbox from "@mui/material/Checkbox";
import MuiSwitch from "@mui/material/Switch";
import MuiFormControlLabel from "@mui/material/FormControlLabel";
import MuiCard from "@mui/material/Card";
import MuiCardContent from "@mui/material/CardContent";

import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Button as FluentButton,
  Field as FluentField,
  Input as FluentInput,
  Checkbox as FluentCheckbox,
  Switch as FluentSwitch,
  Card as FluentCard,
  CardHeader as FluentCardHeader,
} from "@fluentui/react-components";

import type { SystemId } from "@/lib/componentApiRegistry";

/* The systems that render REAL components here. Salt/M3/Fluent via their own
   provider subtree; uoaui (W6-P2a) via the scoped-CSS UoauiReal subtree; carbon
   (W6-P2b) via the CarbonReal subtree (build-time-scoped @carbon/styles +
   theme class). All 5 DSs now render real. See file header. */
const REAL_SYSTEMS = new Set<SystemId>(["salt", "m3", "fluent", "uoaui", "carbon"]);

/* The CORE SET of block types we render real, per the PR scope. Anything else
   returns null so the caller falls back to the Simulated ComponentRenderer. */
const CORE_BLOCKS = new Set<string>([
  "SimulatedButton",
  "SimulatedTextInput",
  "SimulatedCheckbox",
  "SimulatedSwitch",
  "SimulatedCard",
]);

/** True when (system, blockType) renders a real official component here. */
export function canRenderReal(system: SystemId, blockType: string): boolean {
  return REAL_SYSTEMS.has(system) && CORE_BLOCKS.has(blockType);
}

const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/* ── Salt: variant -> sentiment + appearance (mirrors saltButtonAttrs). ── */
function saltButtonProps(variant: string): { sentiment: "accented" | "neutral" | "negative"; appearance: "solid" | "bordered" | "transparent" } {
  const map: Record<string, { sentiment: "accented" | "neutral" | "negative"; appearance: "solid" | "bordered" | "transparent" }> = {
    primary: { sentiment: "accented", appearance: "solid" },
    secondary: { sentiment: "neutral", appearance: "bordered" },
    outline: { sentiment: "neutral", appearance: "bordered" },
    ghost: { sentiment: "neutral", appearance: "transparent" },
    danger: { sentiment: "negative", appearance: "solid" },
    destructive: { sentiment: "negative", appearance: "solid" },
  };
  return map[variant] ?? map.primary;
}

/* ── MUI: variant -> { variant, color } (mirrors m3ButtonAttrs). ── */
function muiButtonProps(variant: string): { variant: "contained" | "outlined" | "text"; color?: "error" } {
  const map: Record<string, { variant: "contained" | "outlined" | "text"; color?: "error" }> = {
    primary: { variant: "contained" },
    secondary: { variant: "outlined" },
    outline: { variant: "outlined" },
    ghost: { variant: "text" },
    danger: { variant: "contained", color: "error" },
    destructive: { variant: "contained", color: "error" },
  };
  return map[variant] ?? map.primary;
}

/* ── Fluent: variant -> appearance (mirrors fluentButtonAttrs). ── */
function fluentButtonProps(variant: string): { appearance: "primary" | "secondary" | "outline" | "subtle"; style?: React.CSSProperties } {
  const map: Record<string, { appearance: "primary" | "secondary" | "outline" | "subtle"; style?: React.CSSProperties }> = {
    primary: { appearance: "primary" },
    secondary: { appearance: "secondary" },
    outline: { appearance: "outline" },
    ghost: { appearance: "subtle" },
    danger: { appearance: "subtle", style: { color: "var(--colorPaletteRedForeground1)" } },
    destructive: { appearance: "subtle", style: { color: "var(--colorPaletteRedForeground1)" } },
  };
  return map[variant] ?? map.primary;
}

type SaltDensity = "high" | "medium" | "low" | "touch";
type SaltMode = "light" | "dark";

interface RealComponentRendererProps {
  system: SystemId;
  type: string;
  /** Light vs dark, derived from the active theme by the gallery. */
  mode: SaltMode;
  /** Salt density (high/medium/low/touch). Ignored by M3/Fluent. */
  saltDensity?: SaltDensity;
  /** The block's default props (variant/label/title/content/...). */
  props: Record<string, unknown>;
}

/* ── Per-cell state props the variants matrix threads in. Real DS props on
   every covered component (disabled, validationStatus, indeterminate); state
   axis values that are pure CSS (hover/focus/rest/open) are rendered in their
   default state by every DS, which is honest for a static, store-free grid. ── */
type ValidationStatus = "error" | "warning" | "success" | undefined;

/* Salt validation status -> FormField validationStatus (no "success" slot;
   Salt FormField exposes error|warning). Success renders as the default field. */
function saltValidation(v: ValidationStatus): "error" | "warning" | undefined {
  return v === "error" ? "error" : v === "warning" ? "warning" : undefined;
}

/* ── SALT real subtree ── */
function SaltReal({ type, mode, saltDensity, props }: Omit<RealComponentRendererProps, "system">) {
  const disabled = Boolean(props.disabled);
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { sentiment, appearance } = saltButtonProps(s(props.variant, "primary"));
    inner = <SaltButton sentiment={sentiment} appearance={appearance} disabled={disabled}>{s(props.label, "Button")}</SaltButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <SaltFormField validationStatus={saltValidation(props.validationStatus as ValidationStatus)} disabled={disabled}>
        <SaltFormFieldLabel>{s(props.label, "Label")}</SaltFormFieldLabel>
        <SaltInput placeholder={s(props.placeholder)} value={s(props.value) || undefined} readOnly />
      </SaltFormField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <SaltCheckbox label={s(props.label)} checked={Boolean(props.defaultChecked)} indeterminate={Boolean(props.indeterminate)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedSwitch") {
    inner = <SaltSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedCard") {
    inner = (
      <SaltCard>
        <h3 style={{ margin: "0 0 4px" }}>{s(props.title, "Card")}</h3>
        <p style={{ margin: 0 }}>{s(props.content)}</p>
      </SaltCard>
    );
  }
  /* Default SaltProvider wraps children in a scoped `.salt-theme` element (no
     global :root/body reset), so this nested provider can't leak to the app. */
  return (
    <SaltProvider mode={mode} density={saltDensity ?? "medium"}>
      {inner}
    </SaltProvider>
  );
}

/* ── M3 (MUI) real subtree ── */
function M3Real({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  /* createTheme with the active mode; emotion styles are scoped per component
     (no global reset). Memoise so the theme isn't rebuilt every render. */
  const theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const disabled = Boolean(props.disabled);
  const validation = props.validationStatus as ValidationStatus;
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { variant, color } = muiButtonProps(s(props.variant, "primary"));
    inner = <MuiButton variant={variant} color={color} disabled={disabled}>{s(props.label, "Button")}</MuiButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <MuiTextField
        label={s(props.label, "Label")}
        placeholder={s(props.placeholder)}
        value={s(props.value) || undefined}
        variant="outlined"
        error={validation === "error"}
        color={validation === "success" ? "success" : validation === "warning" ? "warning" : undefined}
        focused={validation === "success" || validation === "warning" ? true : undefined}
        disabled={disabled}
        slotProps={{ input: { readOnly: true } }}
      />
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <MuiFormControlLabel disabled={disabled} control={<MuiCheckbox checked={Boolean(props.defaultChecked)} indeterminate={Boolean(props.indeterminate)} readOnly />} label={s(props.label)} />;
  } else if (type === "SimulatedSwitch") {
    inner = <MuiFormControlLabel disabled={disabled} control={<MuiSwitch checked={Boolean(props.defaultOn)} readOnly />} label={s(props.label)} />;
  } else if (type === "SimulatedCard") {
    inner = (
      <MuiCard>
        <MuiCardContent>
          <h3 style={{ margin: "0 0 4px" }}>{s(props.title, "Card")}</h3>
          <p style={{ margin: 0 }}>{s(props.content)}</p>
        </MuiCardContent>
      </MuiCard>
    );
  }
  return <MuiThemeProvider theme={theme}>{inner}</MuiThemeProvider>;
}

/* ── Fluent real subtree ── */
function FluentReal({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  const disabled = Boolean(props.disabled);
  const validation = props.validationStatus as ValidationStatus;
  /* Fluent Field validationState is error|warning|success|none. */
  const fluentValidation = validation ?? undefined;
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { appearance, style } = fluentButtonProps(s(props.variant, "primary"));
    inner = <FluentButton appearance={appearance} style={style} disabled={disabled}>{s(props.label, "Button")}</FluentButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <FluentField label={s(props.label, "Label")} validationState={fluentValidation}>
        <FluentInput placeholder={s(props.placeholder)} value={s(props.value) || undefined} disabled={disabled} readOnly />
      </FluentField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <FluentCheckbox label={s(props.label)} checked={Boolean(props.indeterminate) ? "mixed" : Boolean(props.defaultChecked)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedSwitch") {
    inner = <FluentSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedCard") {
    inner = (
      <FluentCard>
        <FluentCardHeader header={s(props.title, "Card")} description={s(props.content)} />
      </FluentCard>
    );
  }
  /* FluentProvider scopes its `--color*` vars + griffel styles to a wrapper
     element; webLight/webDark drive the mode. No global reset. */
  return <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>{inner}</FluentProvider>;
}

/* ── uoaui real subtree (W6-P2a) ──
   uoaui has no npm package: its components are `.a-*` classes styled by the
   DS's own CSS. We reuse the EXISTING theme mechanism the documentation file +
   gallery use — getFullCSS('uoaui', theme, density) = uoauiBuildCSS(theme) +
   getUoauiDensityCSS(density) — then SCOPE the result to `.preview-uoaui.a-app`
   so the DS's global `*{}` reset and `:root{}` block can't leak onto the app /
   builder canvas. The real `.a-*` markup comes from realBlockMap. CSS-only, so
   there's no emotion/griffel engine to gate; the caller's mountedReal flag still
   keeps the <style> client-only (it's deterministic anyway). */

/* The wrapper that scopes uoaui's CSS. `.preview-uoaui` already exists in
   builder.css (bridges --a-* to --ds-*); `.a-app` is the uoaui app-shell
   convention the documentation surface wraps demos in. */
const UOAUI_SCOPE = ".preview-uoaui.a-app";

/* Prefix a comma-separated selector list with UOAUI_SCOPE so nothing escapes
   the wrapper. `:root` becomes the wrapper itself (so :root-declared --a-*
   tokens resolve on it); bare `*` / `*,*::before,*::after` resets become
   descendant selectors of the wrapper. */
function scopeSelectorList(selectorList: string): string {
  return selectorList
    .split(",")
    .map((sel) => {
      const t = sel.trim();
      if (!t) return "";
      if (t === ":root") return UOAUI_SCOPE;
      return `${UOAUI_SCOPE} ${t}`;
    })
    .filter(Boolean)
    .join(", ");
}

/* Scope the uoaui CSS to UOAUI_SCOPE via a brace-depth walk (robust where a
   per-rule regex is fragile on the leading rule + nested at-rules). Each
   top-level rule's selector is prefixed; a nested at-rule (@media
   prefers-reduced-motion) keeps its preamble and has its inner rules scoped.
   sanitizeCSS runs first; we also drop the leftover ` url(...);` that
   sanitizeCSS leaves after stripping the `@import` keyword, so it isn't
   mis-parsed as a selector. */
function scopeUoauiCSS(css: string): string {
  /* Remove the orphaned @font import statement (sanitizeCSS strips the
     `@import` keyword but leaves `url(...);`). */
  const cleaned = css.replace(/^\s*url\([^)]*\)\s*;/gm, "");

  let out = "";
  let i = 0;
  const n = cleaned.length;
  while (i < n) {
    const brace = cleaned.indexOf("{", i);
    if (brace === -1) {
      out += cleaned.slice(i);
      break;
    }
    const preamble = cleaned.slice(i, brace);
    const trimmed = preamble.trim();

    /* Find the matching close brace for this block. */
    let depth = 1;
    let j = brace + 1;
    for (; j < n && depth > 0; j++) {
      if (cleaned[j] === "{") depth++;
      else if (cleaned[j] === "}") depth--;
    }
    const body = cleaned.slice(brace + 1, j - 1);

    if (trimmed.startsWith("@")) {
      /* At-rule (e.g. @media): keep preamble, scope its inner rules. */
      out += `${preamble}{${scopeUoauiCSS(body)}}`;
    } else {
      out += `${scopeSelectorList(preamble)} {${body}}`;
    }
    i = j;
  }
  return out;
}

function UoauiReal({ type, mode, saltDensity, props }: Omit<RealComponentRendererProps, "system">) {
  /* Resolve the uoaui theme object from the active mode (dark/light) and build
     the DS CSS via the shared registry helper. Memoised on mode+density so the
     string isn't reassembled every render. setUoauiT inside uoauiBuildCSS is a
     pure read of the passed theme, so this is render-safe. */
  const density = saltDensity ?? "medium";
  const scopedCss = React.useMemo(() => {
    const theme = getTheme("uoaui", mode === "dark" ? "dark" : "light");
    return scopeUoauiCSS(sanitizeCSS(getFullCSS("uoaui", theme, density)));
  }, [mode, density]);

  const render = getRealBlockRenderer("uoaui", type);
  const inner = render ? render(props) : null;

  return (
    <div className="preview-uoaui a-app">
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      {inner}
    </div>
  );
}

/* ── Carbon real subtree (W6-P2b) ──
   Renders real @carbon/react components (from realBlockMap) inside a
   `.carbon-live-scope` wrapper. The wrapper ALSO carries Carbon's theme class
   (`cds--white` light / `cds--g100` dark) so the build-time-scoped sheet's
   `.carbon-live-scope .cds--white { --cds-*: … }` block sets the official token
   values on the subtree (Carbon themes are class-based, not attribute-based).
   CarbonScopeStyles lazy-injects public/carbon-scoped.css once on first mount,
   so the heavy sheet only loads when Carbon is actually on screen. */
function CarbonReal({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  const render = getRealBlockRenderer("carbon", type);
  const inner = render ? render(props) : null;

  return (
    <>
      <CarbonScopeStyles />
      <div className={`carbon-live-scope ${themeClass}`} data-carbon-theme={mode === "dark" ? "g100" : "white"}>
        {inner}
      </div>
    </>
  );
}

/**
 * Render the REAL official component for (system, type) in the core set, or
 * return null when the pair is out of scope.
 *
 * SSR/hydration contract: the provider style engines (MUI emotion, Fluent
 * griffel) must not run during SSR / first hydration. The CALLER is responsible
 * for client-gating — i.e. only mounting this after a `mounted` effect fires
 * (BuilderBlockGallery's RealOrSimulated does exactly that, and the whole
 * gallery is dynamic-imported `ssr: false`). This keeps the swap to a single
 * mounted guard so there's no empty-demo flash.
 */
export function RealComponentRenderer({
  system,
  type,
  mode,
  saltDensity,
  props,
}: RealComponentRendererProps): React.ReactElement | null {
  if (!canRenderReal(system, type)) return null;

  if (system === "salt") return <SaltReal type={type} mode={mode} saltDensity={saltDensity} props={props} />;
  if (system === "m3") return <M3Real type={type} mode={mode} props={props} />;
  if (system === "fluent") return <FluentReal type={type} mode={mode} props={props} />;
  if (system === "uoaui") return <UoauiReal type={type} mode={mode} saltDensity={saltDensity} props={props} />;
  if (system === "carbon") return <CarbonReal type={type} mode={mode} props={props} />;
  return null;
}
