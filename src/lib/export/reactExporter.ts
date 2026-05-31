/**
 * Export the builder canvas as a standalone React component.
 * Maps each block type to JSX with the active DS's component imports.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block, ZoneId } from "@/store/useBuilder";
import { blockToRealJsx, collectImports, type SystemId } from "@/lib/componentApiRegistry";
import { isChartBlock, hasCharts, chartBlockJsx, chartImports, chartHelperSource } from "./chartExporter";

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
    case "SimulatedTitle":
      return `${indent}<${(p.level as string) || "h2"}>${p.text || "Heading"}</${(p.level as string) || "h2"}>`;
    case "SimulatedButton":
      return `${indent}<button className="btn btn-${p.variant || "primary"}">${p.label || "Button"}</button>`;
    case "SimulatedTextInput":
      return `${indent}<div className="form-field">\n${indent}  <label>${p.label || "Label"}</label>\n${indent}  <input type="text" placeholder="${p.placeholder || ""}" />\n${indent}</div>`;
    case "SimulatedCard":
      return `${indent}<div className="card">\n${indent}  <h3>${p.title || "Card"}</h3>\n${indent}  <p>${p.content || ""}</p>\n${indent}</div>`;
    case "SimulatedStatCard":
      return `${indent}<div className="stat-card">\n${indent}  <span className="stat-label">${p.label || "Metric"}</span>\n${indent}  <span className="stat-value">${p.value || "0"}</span>\n${indent}  <div className="progress-bar" style={{ width: "${p.pct || 0}%" }} />\n${indent}</div>`;
    case "Alert":
      return `${indent}<div className="alert alert-${p.variant || "info"}">\n${indent}  <strong>${p.title || "Alert"}</strong>\n${indent}  <p>${p.message || ""}</p>\n${indent}</div>`;
    case "SimulatedBadge":
      return `${indent}<span className="badge badge-${p.status || "default"}">${p.label || "Badge"}</span>`;
    case "SimulatedCheckbox":
      return `${indent}<label className="checkbox"><input type="checkbox" ${p.defaultChecked ? "defaultChecked" : ""} /> ${p.label || "Checkbox"}</label>`;
    case "SimulatedSwitch":
      return `${indent}<label className="switch"><input type="checkbox" role="switch" ${p.defaultOn ? "defaultChecked" : ""} /> ${p.label || "Toggle"}</label>`;
    case "SimulatedProgress":
      return `${indent}<div className="progress">\n${indent}  <label>${p.label || "Progress"}</label>\n${indent}  <progress value="${p.value || 50}" max="100" />\n${indent}</div>`;
    case "SimulatedTabs":
      return `${indent}<div className="tabs">\n${((p.tabsCsv as string) || "Tab 1, Tab 2").split(",").map((t: string) => `${indent}  <button className="tab">${t.trim()}</button>`).join("\n")}\n${indent}</div>`;
    case "SimulatedAccordion":
      return `${indent}<details className="accordion">\n${indent}  <summary>${p.title || "Section"}</summary>\n${indent}  <p>${p.content || ""}</p>\n${indent}</details>`;
    case "SimulatedAvatar":
      return `${indent}<div className="avatar avatar-${p.size || "md"}">${p.initials || "?"}</div>`;
    case "SimulatedBreadcrumb":
      return `${indent}<nav className="breadcrumb">\n${((p.pathCsv as string) || "Home").split(",").map((s: string, i: number, arr: string[]) => `${indent}  <span>${s.trim()}</span>${i < arr.length - 1 ? " / " : ""}`).join("\n")}\n${indent}</nav>`;
    case "SimulatedDialog":
      return `${indent}<dialog className="dialog">\n${indent}  <h3>${p.title || "Dialog"}</h3>\n${indent}  <p>${p.message || ""}</p>\n${indent}  <button>Close</button>\n${indent}</dialog>`;
    case "SimulatedDropdown":
      return `${indent}<select className="dropdown">\n${indent}  <option value="">${p.placeholder || "Select..."}</option>\n${indent}</select>`;
    case "AppBrand":
      return `${indent}<div className="app-brand">${p.label || "App"}</div>`;
    case "StatusPill":
      return `${indent}<span className="status-pill">${p.label || "Active"}</span>`;
    case "NavItem":
      return `${indent}<button className="nav-item${p.active ? " active" : ""}">\n${indent}  <span className="material-symbols-outlined">${p.icon || "home"}</span>\n${indent}  ${p.label || "Nav"}\n${indent}</button>`;
    case "FooterText":
      return `${indent}<footer className="footer-text">${p.label || ""} ${p.version || ""}</footer>`;
    default:
      return `${indent}<div className="${block.type.toLowerCase()}">{/* ${block.type} */}</div>`;
  }
}

function renderZone(blocks: Block[], zoneName: string, indent: string, system: SystemId, mode: "light" | "dark"): string {
  if (blocks.length === 0) return "";
  const inner = blocks.map((b) => blockToJSX(b, indent + "    ", system, mode)).join("\n");
  return `${indent}  {/* ${zoneName} */}\n${indent}  <div className="zone-${zoneName.toLowerCase()}">\n${inner}\n${indent}  </div>`;
}

export function exportReact(): string {
  const s = useBuilder.getState();
  const system = s.designSystem as SystemId;
  const ds = DS_IMPORTS[s.designSystem] || DS_IMPORTS.salt;

  const mode: "light" | "dark" = s.mode === "dark" ? "dark" : "light";

  const zones = [
    renderZone(s.headerBlocks, "Header", "    ", system, mode),
    renderZone(s.sidebarBlocks, "Sidebar", "    ", system, mode),
    renderZone(s.blocks, "Body", "    ", system, mode),
    renderZone(s.footerBlocks, "Footer", "    ", system, mode),
  ].filter(Boolean).join("\n\n");

  /* Real DS-component imports for the blocks the registry covers. When present
     we emit the real provider + theme + a wrapped tree; otherwise we keep the
     legacy commented provider + generic markup (graceful fallback for DSs not
     yet seeded in the registry). */
  const allTypes = [...s.headerBlocks, ...s.sidebarBlocks, ...s.blocks, ...s.footerBlocks].map((b) => b.type);
  const componentImports = collectImports(system, allTypes);
  const real = componentImports.length > 0;
  const charts = hasCharts(allTypes);

  const imports = ['import React from "react";'];
  /* Charts emit runnable Highcharts — pull in the lib + react wrapper + the 4
     advanced-chart modules. The ChartBlock definition is appended below. */
  if (charts) imports.push(...chartImports());
  if (real) {
    imports.push(...componentImports);
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
