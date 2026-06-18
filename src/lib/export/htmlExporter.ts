/**
 * Export the builder canvas as a standalone HTML page.
 * Generates semantic HTML with inline styles using the active DS theme.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block, ZoneId } from "@/store/useBuilder";
import { htmlText, htmlAttr } from "./escape";
import { computeGroupStyle } from "@/lib/layoutResolver";
import { spanOf } from "./gridSpan";

/* Serialize a React.CSSProperties object to an inline CSS string
   (camelCase → kebab-case; bare numbers → px, matching how the canvas
   renders the same computeGroupStyle output). Used to give an exported
   LayoutGroup the same flex/grid layout it has on the canvas. */
function cssPropsToInlineCss(style: Record<string, string | number | undefined>): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      return `${prop}: ${typeof v === "number" ? `${v}px` : v}`;
    })
    .join("; ");
}

/* class-concat tokens (variant/status/size/level) must be known, slug-safe
   values, never user free text — they form a class name or an element tag. */
const BUTTON_VARIANTS = new Set(["primary", "secondary", "outline", "ghost", "danger", "destructive"]);
const ALERT_VARIANTS = new Set(["info", "success", "warning", "error"]);
const BADGE_STATUSES = new Set(["default", "info", "success", "warning", "error"]);
const AVATAR_SIZES = new Set(["sm", "md", "lg"]);
function token(v: unknown, allowed: Set<string>, fallback: string): string {
  const str = String(v ?? "");
  return allowed.has(str) ? str : fallback;
}
function level(v: unknown): string {
  const str = String(v ?? "h2");
  return /^h[1-6]$/.test(str) ? str : "h2";
}

function blockToHTML(block: Block, indent: string): string {
  const p = block.props;
  switch (block.type) {
    case "SimulatedTitle": {
      const lvl = level(p.level);
      return `${indent}<${lvl}>${htmlText(p.text, "Heading")}</${lvl}>`;
    }
    case "SimulatedButton":
      return `${indent}<button class="btn btn-${token(p.variant, BUTTON_VARIANTS, "primary")}">${htmlText(p.label, "Button")}</button>`;
    case "SimulatedTextInput":
      return `${indent}<div class="form-field">\n${indent}  <label>${htmlText(p.label, "Label")}</label>\n${indent}  <input type="text" placeholder="${htmlAttr(p.placeholder)}" />\n${indent}</div>`;
    case "SimulatedCard":
      return `${indent}<div class="card">\n${indent}  <h3>${htmlText(p.title, "Card")}</h3>\n${indent}  <p>${htmlText(p.content)}</p>\n${indent}</div>`;
    case "SimulatedStatCard":
      return `${indent}<div class="stat-card">\n${indent}  <span class="stat-label">${htmlText(p.label, "Metric")}</span>\n${indent}  <span class="stat-value">${htmlText(p.value, "0")}</span>\n${indent}  <div class="progress-bar" style="width: ${Number(p.pct) || 0}%"></div>\n${indent}</div>`;
    case "Alert":
      return `${indent}<div class="alert alert-${token(p.variant, ALERT_VARIANTS, "info")}">\n${indent}  <strong>${htmlText(p.title, "Alert")}</strong>\n${indent}  <p>${htmlText(p.message)}</p>\n${indent}</div>`;
    case "SimulatedBadge":
      return `${indent}<span class="badge badge-${token(p.status, BADGE_STATUSES, "default")}">${htmlText(p.label, "Badge")}</span>`;
    case "SimulatedCheckbox":
      return `${indent}<label class="checkbox"><input type="checkbox" ${p.defaultChecked ? "checked" : ""} /> ${htmlText(p.label, "Checkbox")}</label>`;
    case "SimulatedSwitch":
      return `${indent}<label class="switch"><input type="checkbox" role="switch" ${p.defaultOn ? "checked" : ""} /> ${htmlText(p.label, "Toggle")}</label>`;
    case "SimulatedProgress":
      return `${indent}<div class="progress">\n${indent}  <label>${htmlText(p.label, "Progress")}</label>\n${indent}  <progress value="${Number(p.value) || 50}" max="100"></progress>\n${indent}</div>`;
    case "SimulatedTabs": {
      const tabs = ((p.tabsCsv as string) || "Tab 1, Tab 2").split(",").map((t: string) => `${indent}  <button class="tab">${htmlText(t.trim())}</button>`).join("\n");
      return `${indent}<div class="tabs">\n${tabs}\n${indent}</div>`;
    }
    case "SimulatedAccordion":
      return `${indent}<details class="accordion">\n${indent}  <summary>${htmlText(p.title, "Section")}</summary>\n${indent}  <p>${htmlText(p.content)}</p>\n${indent}</details>`;
    case "SimulatedAvatar": {
      const avSrc = typeof p.src === "string" ? p.src.trim() : "";
      if (avSrc) {
        return `${indent}<img class="avatar avatar-${token(p.size, AVATAR_SIZES, "md")}" src="${htmlAttr(avSrc)}" alt="${htmlAttr(p.alt ?? p.initials ?? "Avatar")}" loading="lazy" />`;
      }
      return `${indent}<div class="avatar avatar-${token(p.size, AVATAR_SIZES, "md")}">${htmlText(p.initials, "?")}</div>`;
    }
    case "SimulatedImage": {
      /* P0: emit the real stock image (src/alt escaped via htmlAttr); without
         this the picture was dropped to an empty placeholder in exported HTML. */
      const imgSrc = typeof p.src === "string" ? p.src.trim() : "";
      if (!imgSrc) {
        return `${indent}<div class="sim-image-placeholder" role="img" aria-label="${htmlAttr(p.alt ?? "Image")}"></div>`;
      }
      const cap = p.caption ? `\n${indent}  <figcaption>${htmlText(p.caption)}</figcaption>` : "";
      return `${indent}<figure class="sim-image">\n${indent}  <img src="${htmlAttr(imgSrc)}" alt="${htmlAttr(p.alt ?? "Image")}" loading="lazy" />${cap}\n${indent}</figure>`;
    }
    case "SimulatedBreadcrumb":
      return `${indent}<nav class="breadcrumb">${((p.pathCsv as string) || "Home").split(",").map((seg: string) => htmlText(seg.trim())).join(" / ")}</nav>`;
    case "AppBrand":
      return `${indent}<div class="app-brand">${htmlText(p.label, "App")}</div>`;
    case "StatusPill":
      return `${indent}<span class="status-pill">${htmlText(p.label, "Active")}</span>`;
    case "NavItem":
      return `${indent}<button class="nav-item${p.active ? " active" : ""}">${htmlText(p.label, "Nav")}</button>`;
    case "FooterText":
      return `${indent}<footer class="footer-text">${htmlText(p.label)} ${htmlText(p.version)}</footer>`;
    case "LayoutGroup": {
      /* Recurse children into a plain styled flex/grid div mirroring the
         canvas (computeGroupStyle) — export == edit. Before this case the
         default branch dropped every child into an empty placeholder div. */
      const styleCss = cssPropsToInlineCss(computeGroupStyle(block) as Record<string, string | number>);
      const kids = block.children ?? [];
      if (kids.length === 0) {
        return `${indent}<div class="layout-group" style="${styleCss}"></div>`;
      }
      const inner = kids.map((c) => blockToHTML(c, indent + "  ")).join("\n");
      return `${indent}<div class="layout-group" style="${styleCss}">\n${inner}\n${indent}</div>`;
    }
    default:
      return `${indent}<div class="${block.type.toLowerCase()}"><!-- ${block.type} --></div>`;
  }
}

/* Map a zone to its semantic landmark element (consistent with reactExporter)
   so the exported page has a real document outline — header/aside/main/footer —
   instead of anonymous divs. The zone-* class is kept so the shell CSS applies.
   Body becomes <main id="main-content"> — the target of the skip link emitted
   as the first body child; unknown zones fall back to a div. */
const ZONE_TAG: Record<string, { open: string; tag: string }> = {
  header: { open: "<header", tag: "header" },
  sidebar: { open: '<aside aria-label="Sidebar"', tag: "aside" },
  body: { open: '<main id="main-content"', tag: "main" },
  footer: { open: "<footer", tag: "footer" },
};

function renderZone(blocks: Block[], zoneName: string, indent: string): string {
  if (blocks.length === 0) return "";
  /* The body is a 12-col grid (matching the canvas + react/vite exporters).
     Each block is wrapped in a grid-item that carries its span — derived from
     the SAME spanOf as reactExporter, so all runnable exporters agree. Other
     zones are flex and render their blocks directly. */
  const isGrid = zoneName.toLowerCase() === "body";
  const inner = blocks
    .map((b) => {
      if (!isGrid) return blockToHTML(b, indent + "    ");
      const html = blockToHTML(b, indent + "      ");
      return `${indent}    <div class="grid-item" style="grid-column: span ${spanOf(b)}">\n${html}\n${indent}    </div>`;
    })
    .join("\n");
  const z = ZONE_TAG[zoneName.toLowerCase()] ?? { open: "<div", tag: "div" };
  return `${indent}  <!-- ${zoneName} -->\n${indent}  ${z.open} class="zone-${zoneName.toLowerCase()}">\n${inner}\n${indent}  </${z.tag}>`;
}

export function exportHTML(): string {
  const s = useBuilder.getState();
  /* P2 Frames: skip a removed peripheral frame (visible === false) so the
     exported page matches the canvas. Body is always emitted; an undefined flag
     defaults to shown (back-compat with pre-flag saved projects). */
  const zoneVisible = (zone: ZoneId): boolean => s.zoneLayouts?.[zone]?.visible !== false;
  const zones = [
    zoneVisible("header") ? renderZone(s.headerBlocks, "Header", "    ") : "",
    zoneVisible("sidebar") ? renderZone(s.sidebarBlocks, "Sidebar", "    ") : "",
    renderZone(s.blocks, "Body", "    "),
    zoneVisible("footer") ? renderZone(s.footerBlocks, "Footer", "    ") : "",
  ].filter(Boolean).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - ${s.designSystem.toUpperCase()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: ${s.mode === "dark" ? "#0b1120" : "#fff"}; color: ${s.mode === "dark" ? "#e8eaed" : "#1a1a1a"}; }
    /* Skip link — visually hidden until keyboard focus, then reveals at the
       top-left so a keyboard/screen-reader user can jump straight to <main>. */
    .skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; padding: 8px 16px; background: ${s.mode === "dark" ? "#0b1120" : "#fff"}; color: inherit; border-radius: 6px; }
    .skip-link:focus { left: 8px; top: 8px; outline: 2px solid ${s.designSystem === "salt" ? "#1B7F9E" : s.designSystem === "m3" ? "#6750A4" : s.designSystem === "uoaui" ? "#8A58C9" : s.designSystem === "carbon" ? "#0f62fe" : "#0F6CBD"}; outline-offset: 2px; }
    .dashboard-layout { display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: 240px 1fr; min-height: 100vh; }
    .zone-header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .zone-sidebar { padding: 16px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .zone-body { padding: 24px; display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; align-content: start; }
    .zone-body > .grid-item { min-width: 0; }
    @media (max-width: 768px) { .zone-body { grid-template-columns: 1fr; } }
    .zone-footer { grid-column: 1 / -1; padding: 12px 24px; border-top: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; text-align: center; opacity: 0.6; font-size: 12px; }
    .card { padding: 16px; border-radius: 8px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .stat-card { padding: 16px; border-radius: 8px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: ${s.designSystem === "salt" ? "#1B7F9E" : s.designSystem === "m3" ? "#6750A4" : s.designSystem === "uoaui" ? "#8A58C9" : s.designSystem === "carbon" ? "#0f62fe" : "#0F6CBD"}; color: #fff; }
    .nav-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; background: transparent; cursor: pointer; border-radius: 6px; color: inherit; text-align: left; }
    .nav-item.active { background: ${s.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; font-weight: 600; }
    .btn-secondary { background: ${s.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}; color: inherit; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)"}; }
    .btn-outline { background: transparent; color: inherit; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.24)"}; }
    .btn-ghost { background: transparent; color: inherit; }
    .btn-danger, .btn-destructive { background: #d92d20; color: #fff; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${s.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)"}; }
    .badge-info { background: rgba(96,165,250,0.16); border-color: #60a5fa; }
    .badge-success { background: rgba(74,222,128,0.16); border-color: #4ade80; }
    .badge-warning { background: rgba(250,204,21,0.16); border-color: #facc15; }
    .badge-error { background: rgba(248,113,113,0.16); border-color: #f87171; }
    /* Alerts carry a textual prefix (::before) so the meaning never relies on
       colour alone (use-of-color). */
    .alert { padding: 12px 16px; border-radius: 8px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)"}; border-left-width: 4px; }
    .alert::before { font-weight: 700; margin-right: 6px; }
    .alert-info { background: rgba(96,165,250,0.12); border-left-color: #60a5fa; }
    .alert-info::before { content: "Info:"; }
    .alert-success { background: rgba(74,222,128,0.12); border-left-color: #4ade80; }
    .alert-success::before { content: "Success:"; }
    .alert-warning { background: rgba(250,204,21,0.12); border-left-color: #facc15; }
    .alert-warning::before { content: "Warning:"; }
    .alert-error { background: rgba(248,113,113,0.12); border-left-color: #f87171; }
    .alert-error::before { content: "Error:"; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .tab { padding: 8px 12px; border: 0; background: transparent; color: inherit; opacity: 0.7; font-family: inherit; font-size: 13px; cursor: pointer; }
    .tab:hover { opacity: 1; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field input { padding: 8px 12px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}; border-radius: 4px; background: transparent; color: inherit; }
    /* Keyboard focus rings — .btn sets border:none, so the ring is an outline. */
    .btn:focus-visible, .tab:focus-visible, .nav-item:focus-visible, a:focus-visible { outline: 2px solid ${s.designSystem === "salt" ? "#1B7F9E" : s.designSystem === "m3" ? "#6750A4" : s.designSystem === "uoaui" ? "#8A58C9" : s.designSystem === "carbon" ? "#0f62fe" : "#0F6CBD"}; outline-offset: 2px; }
    input:focus-visible, .checkbox input:focus-visible, .switch input:focus-visible { outline: 2px solid ${s.designSystem === "salt" ? "#1B7F9E" : s.designSystem === "m3" ? "#6750A4" : s.designSystem === "uoaui" ? "#8A58C9" : s.designSystem === "carbon" ? "#0f62fe" : "#0F6CBD"}; outline-offset: 1px; }
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="dashboard-layout" data-mode="${s.mode}" data-ds="${s.designSystem}">
${zones}
  </div>
</body>
</html>`;
}
