/**
 * Export the builder canvas as a standalone React component.
 * Maps each block type to JSX with the active DS's component imports.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block, ZoneId } from "@/store/useBuilder";

const DS_IMPORTS: Record<string, { provider: string; importFrom: string }> = {
  salt: { provider: "SaltProvider", importFrom: "@salt-ds/core" },
  m3: { provider: "ThemeProvider", importFrom: "@mui/material" },
  fluent: { provider: "FluentProvider", importFrom: "@fluentui/react-components" },
  ausos: { provider: "AusosProvider", importFrom: "@ausos/core" },
};

function blockToJSX(block: Block, indent: string): string {
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
    case "SimulatedChart":
    case "HighchartLine": case "HighchartArea": case "HighchartColumn": case "HighchartPie":
    case "HighchartScatter": case "HighchartBar": case "HighchartDonut": case "HighchartSpline":
    case "HighchartStackedColumn": case "HighchartGauge": case "HighchartHeatmap": case "HighchartTreemap":
      return `${indent}<div className="chart-placeholder">\n${indent}  {/* ${p.title || "Chart"} - integrate with Highcharts */}\n${indent}  <p>${p.title || "Chart"}</p>\n${indent}</div>`;
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

function renderZone(blocks: Block[], zoneName: string, indent: string): string {
  if (blocks.length === 0) return "";
  const inner = blocks.map((b) => blockToJSX(b, indent + "    ")).join("\n");
  return `${indent}  {/* ${zoneName} */}\n${indent}  <div className="zone-${zoneName.toLowerCase()}">\n${inner}\n${indent}  </div>`;
}

export function exportReact(): string {
  const s = useBuilder.getState();
  const ds = DS_IMPORTS[s.designSystem] || DS_IMPORTS.salt;

  const zones = [
    renderZone(s.headerBlocks, "Header", "    "),
    renderZone(s.sidebarBlocks, "Sidebar", "    "),
    renderZone(s.blocks, "Body", "    "),
    renderZone(s.footerBlocks, "Footer", "    "),
  ].filter(Boolean).join("\n\n");

  return `import React from "react";
// import { ${ds.provider} } from "${ds.importFrom}";

export default function Dashboard() {
  return (
    <div className="dashboard-layout" data-mode="${s.mode}" data-density="${s.density}">
${zones}
    </div>
  );
}
`;
}
