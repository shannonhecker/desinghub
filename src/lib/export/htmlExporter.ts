/**
 * Export the builder canvas as a standalone HTML page.
 * Generates semantic HTML with inline styles using the active DS theme.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";

function blockToHTML(block: Block, indent: string): string {
  const p = block.props;
  switch (block.type) {
    case "SimulatedTitle":
      return `${indent}<${(p.level as string) || "h2"}>${p.text || "Heading"}</${(p.level as string) || "h2"}>`;
    case "SimulatedButton":
      return `${indent}<button class="btn btn-${p.variant || "primary"}">${p.label || "Button"}</button>`;
    case "SimulatedTextInput":
      return `${indent}<div class="form-field">\n${indent}  <label>${p.label || "Label"}</label>\n${indent}  <input type="text" placeholder="${p.placeholder || ""}" />\n${indent}</div>`;
    case "SimulatedCard":
      return `${indent}<div class="card">\n${indent}  <h3>${p.title || "Card"}</h3>\n${indent}  <p>${p.content || ""}</p>\n${indent}</div>`;
    case "SimulatedStatCard":
      return `${indent}<div class="stat-card">\n${indent}  <span class="stat-label">${p.label || "Metric"}</span>\n${indent}  <span class="stat-value">${p.value || "0"}</span>\n${indent}  <div class="progress-bar" style="width: ${p.pct || 0}%"></div>\n${indent}</div>`;
    case "Alert":
      return `${indent}<div class="alert alert-${p.variant || "info"}">\n${indent}  <strong>${p.title || "Alert"}</strong>\n${indent}  <p>${p.message || ""}</p>\n${indent}</div>`;
    case "SimulatedBadge":
      return `${indent}<span class="badge badge-${p.status || "default"}">${p.label || "Badge"}</span>`;
    case "SimulatedCheckbox":
      return `${indent}<label class="checkbox"><input type="checkbox" ${p.defaultChecked ? "checked" : ""} /> ${p.label || "Checkbox"}</label>`;
    case "SimulatedSwitch":
      return `${indent}<label class="switch"><input type="checkbox" role="switch" ${p.defaultOn ? "checked" : ""} /> ${p.label || "Toggle"}</label>`;
    case "SimulatedProgress":
      return `${indent}<div class="progress">\n${indent}  <label>${p.label || "Progress"}</label>\n${indent}  <progress value="${p.value || 50}" max="100"></progress>\n${indent}</div>`;
    case "SimulatedTabs": {
      const tabs = ((p.tabsCsv as string) || "Tab 1, Tab 2").split(",").map((t: string) => `${indent}  <button class="tab">${t.trim()}</button>`).join("\n");
      return `${indent}<div class="tabs">\n${tabs}\n${indent}</div>`;
    }
    case "SimulatedAccordion":
      return `${indent}<details class="accordion">\n${indent}  <summary>${p.title || "Section"}</summary>\n${indent}  <p>${p.content || ""}</p>\n${indent}</details>`;
    case "SimulatedAvatar":
      return `${indent}<div class="avatar avatar-${p.size || "md"}">${p.initials || "?"}</div>`;
    case "SimulatedBreadcrumb":
      return `${indent}<nav class="breadcrumb">${((p.pathCsv as string) || "Home").split(",").map((s: string) => s.trim()).join(" / ")}</nav>`;
    case "AppBrand":
      return `${indent}<div class="app-brand">${p.label || "App"}</div>`;
    case "StatusPill":
      return `${indent}<span class="status-pill">${p.label || "Active"}</span>`;
    case "NavItem":
      return `${indent}<button class="nav-item${p.active ? " active" : ""}">${p.label || "Nav"}</button>`;
    case "FooterText":
      return `${indent}<footer class="footer-text">${p.label || ""} ${p.version || ""}</footer>`;
    default:
      return `${indent}<div class="${block.type.toLowerCase()}"><!-- ${block.type} --></div>`;
  }
}

function renderZone(blocks: Block[], zoneName: string, indent: string): string {
  if (blocks.length === 0) return "";
  const inner = blocks.map((b) => blockToHTML(b, indent + "    ")).join("\n");
  return `${indent}  <!-- ${zoneName} -->\n${indent}  <div class="zone-${zoneName.toLowerCase()}">\n${inner}\n${indent}  </div>`;
}

export function exportHTML(): string {
  const s = useBuilder.getState();
  const zones = [
    renderZone(s.headerBlocks, "Header", "    "),
    renderZone(s.sidebarBlocks, "Sidebar", "    "),
    renderZone(s.blocks, "Body", "    "),
    renderZone(s.footerBlocks, "Footer", "    "),
  ].filter(Boolean).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard — ${s.designSystem.toUpperCase()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: ${s.mode === "dark" ? "#0b1120" : "#fff"}; color: ${s.mode === "dark" ? "#e8eaed" : "#1a1a1a"}; }
    .dashboard-layout { display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: 240px 1fr; min-height: 100vh; }
    .zone-header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .zone-sidebar { padding: 16px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .zone-body { padding: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; align-content: start; }
    .zone-footer { grid-column: 1 / -1; padding: 12px 24px; border-top: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; text-align: center; opacity: 0.6; font-size: 12px; }
    .card { padding: 16px; border-radius: 8px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .stat-card { padding: 16px; border-radius: 8px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; }
    .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: ${s.designSystem === "salt" ? "#1B7F9E" : s.designSystem === "m3" ? "#6750A4" : s.designSystem === "ausos" ? "#7E6BC4" : "#0F6CBD"}; color: #fff; }
    .nav-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; background: transparent; cursor: pointer; border-radius: 6px; color: inherit; text-align: left; }
    .nav-item.active { background: ${s.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; font-weight: 600; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .alert { padding: 12px 16px; border-radius: 8px; border-left: 4px solid; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field input { padding: 8px 12px; border: 1px solid ${s.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}; border-radius: 4px; background: transparent; color: inherit; }
  </style>
</head>
<body>
  <div class="dashboard-layout" data-mode="${s.mode}" data-ds="${s.designSystem}">
${zones}
  </div>
</body>
</html>`;
}
