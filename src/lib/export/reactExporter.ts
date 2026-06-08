/**
 * Export the builder canvas as a standalone React component.
 * Maps each block type to JSX with the active DS's component imports.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block, ZoneId, ZoneLayout } from "@/store/useBuilder";
import { blockToRealJsx, collectImports, type SystemId } from "@/lib/componentApiRegistry";
import { layoutToJsx, collectLayoutImports, type LayoutChild, type LayoutPrimitive } from "@/lib/layoutRegistry";
import { isChartBlock, hasCharts, chartBlockJsx, chartImports, chartHelperSource } from "./chartExporter";
import { jsxText, jsxAttr } from "./escape";

/* Generic-fallback variant/status are concatenated into a className string, so
   they must be a known, slug-safe token (never free text). Validate against the
   block's documented set; anything else falls back to the safe default. */
const FALLBACK_BUTTON_VARIANTS = new Set(["primary", "secondary", "outline", "ghost", "danger", "destructive"]);
const FALLBACK_ALERT_VARIANTS = new Set(["info", "success", "warning", "error"]);
const FALLBACK_BADGE_STATUSES = new Set(["default", "info", "success", "warning", "error"]);
function safeToken(v: unknown, allowed: Set<string>, fallback: string): string {
  const str = String(v ?? "");
  return allowed.has(str) ? str : fallback;
}
/* Heading level becomes a JSX tag name, so it must be a known h1–h4 (never free
   text — a malformed level would emit an unbalanced/invalid element). */
function safeLevel(v: unknown): string {
  const str = String(v ?? "h2");
  return /^h[1-6]$/.test(str) ? str : "h2";
}
/* Avatar size suffixes a className (avatar-${size}); constrain to known tokens. */
const FALLBACK_AVATAR_SIZES = new Set(["sm", "md", "lg"]);
function slugSize(v: unknown): string {
  return safeToken(v, FALLBACK_AVATAR_SIZES, "md");
}

/* A ZoneLayout mode -> the abstract layout primitive the registry resolves to
   each DS's real layout component. Anything else (no layout) -> null (keep the
   generic zone div). */
function primitiveForMode(mode: ZoneLayout["mode"] | undefined): LayoutPrimitive | null {
  return mode === "grid" ? "grid" : mode === "stack" ? "stack" : mode === "row" ? "row" : null;
}

/* P3 export twin: project a block's counter-axis (height) sizing into a JSX
   style-object body (no surrounding braces) for the layout registry to wrap
   the child in a <div style={{…}}>. Mirrors layoutResolver.applyHeight so the
   exported code matches the edit canvas + preview:
     'auto'       -> Hug (nothing — content height; honour min/max if present)
     'fill'       -> Fill (height:100%) so the child stretches in its track
     '{N}px/%'    -> Fixed (height: "…")
   minHeight / maxHeight always projected when present. Returns undefined when
   the block has NO height sizing at all (the common case — keeps output lean
   and avoids gratuitous wrapper divs). */
function heightStyleOf(block: Block): string | undefined {
  const h = block.layout?.height;
  const minH = block.layout?.minHeight;
  const maxH = block.layout?.maxHeight;
  const toLen = (v: typeof h): string | undefined => {
    if (v === undefined || v === "fill" || v === "auto") return undefined;
    if (typeof v === "number") return `${v}px`;
    return v;
  };
  const parts: string[] = [];
  if (h === "fill") parts.push(`height: "100%"`);
  else {
    const hLen = toLen(h);
    if (hLen) parts.push(`height: ${JSON.stringify(hLen)}`);
  }
  const minLen = toLen(minH);
  if (minLen) parts.push(`minHeight: ${JSON.stringify(minLen)}`);
  const maxLen = toLen(maxH);
  if (maxLen) parts.push(`maxHeight: ${JSON.stringify(maxLen)}`);
  return parts.length ? parts.join(", ") : undefined;
}

/* Derive a block's canonical 12-fr column span from its layout.width for grid
   export. "Nfr" -> N; "X%" -> proportional; fill/auto/px/undefined -> full row
   (12, which normalizeColumns maps to the DS's full native width). */
function spanOf(block: Block): number {
  const w = block.layout?.width;
  if (typeof w === "string") {
    if (w.endsWith("fr")) {
      const n = parseFloat(w);
      if (Number.isFinite(n)) return n;
    }
    if (w.endsWith("%")) {
      const pct = parseFloat(w);
      if (Number.isFinite(pct)) return Math.max(1, Math.round((pct / 100) * 12));
    }
  }
  return 12;
}

const DS_IMPORTS: Record<string, { provider: string; importFrom: string }> = {
  salt: { provider: "SaltProvider", importFrom: "@salt-ds/core" },
  m3: { provider: "ThemeProvider", importFrom: "@mui/material" },
  fluent: { provider: "FluentProvider", importFrom: "@fluentui/react-components" },
  uoaui: { provider: "UoauiProvider", importFrom: "@uoaui/core" },
  carbon: { provider: "Theme", importFrom: "@carbon/react" },
};

function blockToJSX(block: Block, indent: string, system: SystemId, mode: "light" | "dark"): string {
  /* Charts emit a runnable <ChartBlock> (real Highcharts) — handled before the
     registry-first path since the ComponentAPIRegistry doesn't cover charts. */
  if (isChartBlock(block.type)) {
    return indent + chartBlockJsx(block, mode);
  }
  /* Prefer real DS-component JSX from the ComponentAPIRegistry; fall back to
     the generic markup for blocks / DSs the registry doesn't cover yet. */
  const real = blockToRealJsx(system, block);
  if (real) return real.split("\n").map((line) => indent + line).join("\n");
  const p = block.props;
  switch (block.type) {
    case "SimulatedTitle": {
      const lvl = safeLevel(p.level);
      return `${indent}<${lvl}>${jsxText(p.text, "Heading")}</${lvl}>`;
    }
    case "SimulatedButton":
      return `${indent}<button className="btn btn-${safeToken(p.variant, FALLBACK_BUTTON_VARIANTS, "primary")}">${jsxText(p.label, "Button")}</button>`;
    case "SimulatedTextInput":
      return `${indent}<div className="form-field">\n${indent}  <label>${jsxText(p.label, "Label")}</label>\n${indent}  <input type="text" placeholder="${jsxAttr(p.placeholder)}" />\n${indent}</div>`;
    case "SimulatedCard":
      return `${indent}<div className="card">\n${indent}  <h3>${jsxText(p.title, "Card")}</h3>\n${indent}  <p>${jsxText(p.content)}</p>\n${indent}</div>`;
    case "SimulatedStatCard":
      return `${indent}<div className="stat-card">\n${indent}  <span className="stat-label">${jsxText(p.label, "Metric")}</span>\n${indent}  <span className="stat-value">${jsxText(p.value, "0")}</span>\n${indent}  <div className="progress-bar" style={{ width: "${Number(p.pct) || 0}%" }} />\n${indent}</div>`;
    case "Alert":
      return `${indent}<div className="alert alert-${safeToken(p.variant, FALLBACK_ALERT_VARIANTS, "info")}">\n${indent}  <strong>${jsxText(p.title, "Alert")}</strong>\n${indent}  <p>${jsxText(p.message)}</p>\n${indent}</div>`;
    case "SimulatedBadge":
      return `${indent}<span className="badge badge-${safeToken(p.status, FALLBACK_BADGE_STATUSES, "default")}">${jsxText(p.label, "Badge")}</span>`;
    case "SimulatedCheckbox":
      return `${indent}<label className="checkbox"><input type="checkbox" ${p.defaultChecked ? "defaultChecked" : ""} /> ${jsxText(p.label, "Checkbox")}</label>`;
    case "SimulatedSwitch":
      return `${indent}<label className="switch"><input type="checkbox" role="switch" ${p.defaultOn ? "defaultChecked" : ""} /> ${jsxText(p.label, "Toggle")}</label>`;
    case "SimulatedProgress":
      return `${indent}<div className="progress">\n${indent}  <label>${jsxText(p.label, "Progress")}</label>\n${indent}  <progress value="${Number(p.value) || 50}" max="100" />\n${indent}</div>`;
    case "SimulatedTabs":
      return `${indent}<div className="tabs">\n${((p.tabsCsv as string) || "Tab 1, Tab 2").split(",").map((t: string) => `${indent}  <button className="tab">${jsxText(t.trim())}</button>`).join("\n")}\n${indent}</div>`;
    case "SimulatedAccordion":
      return `${indent}<details className="accordion">\n${indent}  <summary>${jsxText(p.title, "Section")}</summary>\n${indent}  <p>${jsxText(p.content)}</p>\n${indent}</details>`;
    case "SimulatedAvatar": {
      /* Emit the real photo when a stock/avatar src is set (templates now
         default avatars to real images); fall back to initials otherwise. */
      const avSrc = typeof p.src === "string" ? p.src.trim() : "";
      if (avSrc) {
        return `${indent}<img className="avatar avatar-${slugSize(p.size)}" src="${jsxAttr(avSrc)}" alt="${jsxAttr(p.alt ?? p.initials ?? "Avatar")}" loading="lazy" />`;
      }
      return `${indent}<div className="avatar avatar-${slugSize(p.size)}">${jsxText(p.initials, "?")}</div>`;
    }
    case "SimulatedImage": {
      /* P0: templates wire stock-image URLs into `src`; without this case the
         block fell through to the empty placeholder div and every picture was
         dropped from exported code. Emit a real <img> (src/alt escaped via
         jsxAttr → injection-safe); keep a labelled placeholder when no src. */
      const imgSrc = typeof p.src === "string" ? p.src.trim() : "";
      if (!imgSrc) {
        return `${indent}<div className="sim-image-placeholder" role="img" aria-label="${jsxAttr(p.alt ?? "Image")}" />`;
      }
      const cap = p.caption ? `\n${indent}  <figcaption>${jsxText(p.caption)}</figcaption>` : "";
      return `${indent}<figure className="sim-image">\n${indent}  <img src="${jsxAttr(imgSrc)}" alt="${jsxAttr(p.alt ?? "Image")}" loading="lazy" />${cap}\n${indent}</figure>`;
    }
    case "SimulatedBreadcrumb":
      return `${indent}<nav className="breadcrumb">\n${((p.pathCsv as string) || "Home").split(",").map((seg: string, i: number, arr: string[]) => `${indent}  <span>${jsxText(seg.trim())}</span>${i < arr.length - 1 ? " / " : ""}`).join("\n")}\n${indent}</nav>`;
    case "SimulatedDialog":
      return `${indent}<dialog className="dialog">\n${indent}  <h3>${jsxText(p.title, "Dialog")}</h3>\n${indent}  <p>${jsxText(p.message)}</p>\n${indent}  <button>Close</button>\n${indent}</dialog>`;
    case "SimulatedDropdown":
      return `${indent}<select className="dropdown">\n${indent}  <option value="">${jsxText(p.placeholder, "Select...")}</option>\n${indent}</select>`;
    case "AppBrand":
      return `${indent}<div className="app-brand">${jsxText(p.label, "App")}</div>`;
    case "StatusPill":
      return `${indent}<span className="status-pill">${jsxText(p.label, "Active")}</span>`;
    case "NavItem":
      return `${indent}<button className="nav-item${p.active ? " active" : ""}">\n${indent}  <span className="material-symbols-outlined">${jsxText(p.icon, "home")}</span>\n${indent}  ${jsxText(p.label, "Nav")}\n${indent}</button>`;
    case "FooterText":
      return `${indent}<footer className="footer-text">${jsxText(p.label)} ${jsxText(p.version)}</footer>`;
    default:
      return `${indent}<div className="${block.type.toLowerCase()}">{/* ${block.type} */}</div>`;
  }
}

function renderZone(
  blocks: Block[],
  zoneName: string,
  indent: string,
  system: SystemId,
  mode: "light" | "dark",
  layout: ZoneLayout | undefined,
  useDsLayout: boolean,
  usedPrimitives: Set<LayoutPrimitive>,
): string {
  if (blocks.length === 0) return "";
  /* When we're emitting real DS code, let the DS own the layout: wrap the
     zone's blocks in the DS's real grid/stack/row primitive (carrying each
     block's canonical 12-fr span), instead of a custom `zone-*` div. */
  const prim = primitiveForMode(layout?.mode);
  if (useDsLayout && prim) {
    const children: LayoutChild[] = blocks.map((b) => ({
      jsx: blockToJSX(b, "", system, mode).trim(),
      span: prim === "grid" ? spanOf(b) : undefined,
      /* P3 export twin: carry each block's height projection so the registry
         wraps it in a styled div where the DS primitive can't set height. */
      heightStyle: heightStyleOf(b),
    }));
    /* P4/P5 export twin: thread justify (main-axis distribution), align (cross-
       axis), and the P5 per-side padding + per-axis gap from the ZoneLayout into
       the registry's per-DS toJsx so the values reach generated code (the export
       trap — they silently die if the projection only forwards columns/gap).
       Each DS maps them to a native prop (Salt FlexLayout justify/align, MUI sx)
       or a CSS-wrapper style fallback. Pass `gap` (number | {row,col}) and
       `padding` (number | {t,r,b,l}) UNCHANGED so the registry can derive both
       the DS-native single-value gap AND the per-side/per-axis CSS overrides. */
    const wrapped = layoutToJsx(
      system,
      prim,
      {
        columns: layout?.columns ?? 12,
        gap: layout?.gap ?? 3,
        padding: layout?.padding,
        justify: layout?.justify,
        align: layout?.align,
      },
      children,
    );
    if (wrapped) {
      usedPrimitives.add(prim);
      return `${indent}  {/* ${zoneName} */}\n${indent}  ${wrapped}`;
    }
  }
  /* Generic-zone fallback (DSs / blocks the registry doesn't cover): still
     honour height by wrapping the block's JSX in a styled div (the export
     trap — height must not silently die on the non-registry path either). */
  const inner = blocks
    .map((b) => {
      const hs = heightStyleOf(b);
      if (!hs) return blockToJSX(b, indent + "    ", system, mode);
      return `${indent}    <div style={{ ${hs} }}>\n${blockToJSX(b, indent + "      ", system, mode)}\n${indent}    </div>`;
    })
    .join("\n");
  return `${indent}  {/* ${zoneName} */}\n${indent}  <div className="zone-${zoneName.toLowerCase()}">\n${inner}\n${indent}  </div>`;
}

export function exportReact(): string {
  const s = useBuilder.getState();
  const system = s.designSystem as SystemId;
  const ds = DS_IMPORTS[s.designSystem] || DS_IMPORTS.salt;

  const mode: "light" | "dark" = s.mode === "dark" ? "dark" : "light";

  /* Real DS-component imports for the blocks the registry covers. When present
     we emit the real provider + theme + a wrapped tree; otherwise we keep the
     legacy commented provider + generic markup (graceful fallback for DSs not
     yet seeded in the registry).

     Pass the FULL block objects (type + props), not just types: prop-dependent
     import specs (e.g. Fluent/Carbon NavItem, whose icon import is chosen from
     `props.icon`) must see real props, or every block resolves to the default
     icon's import — leaving the JSX referencing un-imported names (TS2304). */
  const allBlocks = [...s.headerBlocks, ...s.sidebarBlocks, ...s.blocks, ...s.footerBlocks];
  const allTypes = allBlocks.map((b) => b.type);
  const componentImports = collectImports(system, allBlocks);
  const real = componentImports.length > 0;
  const charts = hasCharts(allTypes);

  /* Zones: when emitting real DS code, the DS owns the layout — each zone's
     blocks are wrapped in its real grid/stack/row primitive (driven by the
     zone's ZoneLayout mode + each block's 12-fr span). usedPrimitives feeds the
     layout-component import line below. */
  const zl: Partial<Record<ZoneId, ZoneLayout>> = s.zoneLayouts ?? {};
  const usedPrimitives = new Set<LayoutPrimitive>();
  /* P2 Frames: a peripheral frame the user removed (zoneLayouts[zone].visible
     === false) must NOT reach the generated code — otherwise exported output
     diverges from the canvas (the export trap). Body has no visibility flag and
     is always emitted. visible === undefined defaults to shown (back-compat with
     saved projects that predate the flag). */
  const zoneVisible = (zone: ZoneId): boolean => zl[zone]?.visible !== false;
  const zones = [
    zoneVisible("header") ? renderZone(s.headerBlocks, "Header", "    ", system, mode, zl.header, real, usedPrimitives) : "",
    zoneVisible("sidebar") ? renderZone(s.sidebarBlocks, "Sidebar", "    ", system, mode, zl.sidebar, real, usedPrimitives) : "",
    renderZone(s.blocks, "Body", "    ", system, mode, zl.body, real, usedPrimitives),
    zoneVisible("footer") ? renderZone(s.footerBlocks, "Footer", "    ", system, mode, zl.footer, real, usedPrimitives) : "",
  ].filter(Boolean).join("\n\n");
  const layoutImports = collectLayoutImports(system, [...usedPrimitives]);

  const imports = ['import React from "react";'];
  /* Chart components use hooks + window, so the exported file must be a client
     component to also work if pasted into a Next.js App Router project. "use
     client" must be the file's first line; it is a harmless no-op in the
     documented Vite target. */
  if (charts) imports.unshift('"use client";', "");
  /* Charts emit runnable Highcharts — pull in the lib + react wrapper + the 4
     advanced-chart modules. The ChartBlock definition is appended below. */
  if (charts) imports.push(...chartImports());
  if (real) {
    imports.push(...componentImports);
    /* Real DS layout-component imports (GridLayout/Grid/Column/Stack/...) for
       the zone primitives used above. uoaui contributes none (className-only). */
    imports.push(...layoutImports);
    /* Provider import differs per DS API. */
    if (system === "m3") {
      imports.push('import { ThemeProvider, createTheme } from "@mui/material";');
    } else if (system === "fluent") {
      imports.push(`import { FluentProvider, ${s.mode === "dark" ? "webDarkTheme" : "webLightTheme"} } from "@fluentui/react-components";`);
    } else if (system === "uoaui") {
      /* uoaui is CSS-only — its stylesheet side-effect import already comes from
         componentImports; there is no JS provider package to import. */
    } else {
      imports.push(`import { ${ds.provider} } from "${ds.importFrom}";`);
    }
    if (system === "salt") imports.push('import "@salt-ds/theme/index.css";');
    if (system === "carbon") imports.push('import "@carbon/styles/css/styles.css";');
  } else {
    imports.push(`// import { ${ds.provider} } from "${ds.importFrom}";`);
  }

  /* Per-DS provider wrapping — each provider's API differs (Salt takes mode=,
     MUI takes theme=createTheme(...)). */
  const open = !real
    ? ""
    : system === "m3"
      ? `<ThemeProvider theme={createTheme({ palette: { mode: "${s.mode}" } })}>\n    `
      : system === "fluent"
        ? `<FluentProvider theme={${s.mode === "dark" ? "webDarkTheme" : "webLightTheme"}}>\n    `
        : system === "carbon"
          ? `<Theme theme="${s.mode === "dark" ? "g100" : "white"}">\n    `
          : system === "uoaui"
            ? "" /* CSS-only DS — no provider wrapper, just a-* classNames */
            : `<${ds.provider} mode="${s.mode}">\n    `;
  const close = !real
    ? ""
    : system === "m3"
      ? "\n    </ThemeProvider>"
      : system === "fluent"
        ? "\n    </FluentProvider>"
        : system === "carbon"
          ? "\n    </Theme>"
          : system === "uoaui"
            ? ""
            : `\n    </${ds.provider}>`;

  const helper = charts ? `\n${chartHelperSource(system)}` : "";

  return `${imports.join("\n")}

export default function Dashboard() {
  return (
    ${open}<div className="dashboard-layout" data-mode="${s.mode}" data-density="${s.density}">
${zones}
    </div>${close}
  );
}
${helper}`;
}
