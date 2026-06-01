/**
 * Export the Builder canvas as a standalone Vite + React project,
 * packaged as a single "bootstrap.sh" shell script that recreates
 * the full folder structure on disk.
 *
 * Why a shell script instead of a zip file?
 *   - Zero new dependencies (no JSZip, no pako, etc.)
 *   - Single-file download; users run `sh design-hub-project.sh`
 *     (or double-click on Unix) to get a working npm project.
 *   - Each file is a here-doc so users can also inspect/edit the
 *     script itself to see what's being generated.
 *
 * Output contains:
 *   - package.json    (Vite 5 + React 18 + TypeScript)
 *   - vite.config.ts  (React plugin, port 5173)
 *   - tsconfig.json   (strict + ESNext target)
 *   - index.html      (entry HTML)
 *   - src/main.tsx    (ReactDOM.createRoot bootstrap)
 *   - src/App.tsx     (generated from current canvas)
 *   - src/styles.css  (design-system CSS tokens + component styles)
 *   - README.md       (next steps)
 */

import { useBuilder } from "@/store/useBuilder";
import { exportReact } from "./reactExporter";
import { collectImports, type SystemId } from "@/lib/componentApiRegistry";

const PROJECT_NAME = "design-hub-app";

/**
 * Dependencies for the exported project are DERIVED from the REAL imports the
 * codegen emits (componentApiRegistry.collectImports), so package.json always
 * matches what src/App.tsx actually imports — including the secondary packages
 * a given block needs (@salt-ds/lab, @mui/x-tree-view, @fluentui/react-nav-preview,
 * icon packages, etc.). No hand-maintained per-DS list to drift out of sync.
 *
 * uoaui is CSS-only: its only "import" is the local ./uoaui-theme.css side
 * effect (emitted by buildProjectFiles), which resolves to no npm package.
 */
const VERSION_MAP: Record<string, string> = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "@salt-ds/core": "^1.45.0",
  "@salt-ds/theme": "^1.18.0",
  "@salt-ds/lab": "latest",
  "@salt-ds/icons": "^1.14.0",
  "@mui/material": "^6.4.0",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0",
  "@mui/x-tree-view": "latest",
  "@mui/icons-material": "latest",
  "@fluentui/react-components": "^9.66.0",
  "@fluentui/react-nav-preview": "latest",
  "@fluentui/react-datepicker-compat": "latest",
  "@fluentui/react-icons": "latest",
  "@fluentui/react-search": "latest",
  "@carbon/react": "^1.71.0",
  "@carbon/styles": "^1.70.0",
  "@carbon/icons-react": "^11.78.0",
  highcharts: "^12.5.0",
  "highcharts-react-official": "^3.2.3",
};

/** A "version not found" install failure is worse than a slightly-loose range:
 *  packages we don't explicitly pin fall back to the published "latest" tag. */
function ver(pkg: string): string {
  return VERSION_MAP[pkg] ?? "latest";
}

/** Provider/theme packages each DS needs even when no single component import
 *  surfaces them (the React provider + the token stylesheet). uoaui = none. */
const DS_PROVIDER_PKGS: Record<string, string[]> = {
  salt: ["@salt-ds/core", "@salt-ds/theme"],
  m3: ["@mui/material", "@emotion/react", "@emotion/styled"],
  fluent: ["@fluentui/react-components"],
  carbon: ["@carbon/react", "@carbon/styles"],
  uoaui: [],
};

/** npm package name from an import source path:
 *   "@salt-ds/lab"                   -> "@salt-ds/lab"
 *   "@mui/x-date-pickers/DatePicker" -> "@mui/x-date-pickers"
 *   "highcharts/modules/heatmap"     -> "highcharts"
 *   "@salt-ds/theme/index.css"       -> "@salt-ds/theme"
 *   "./uoaui-theme.css"              -> null (local file, not a package) */
function packageOf(from: string): string | null {
  if (from.startsWith(".") || from.startsWith("/")) return null;
  const parts = from.split("/");
  return from.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * Build package.json for the exported project. dependencies = base React +
 * the active DS's provider/theme packages + every package the emitted imports
 * actually reference (via collectImports) + Highcharts when charts are present.
 * Versions come from VERSION_MAP (unknown packages fall back to "latest").
 */
function packageJson(system: string, allTypes: string[], hasCharts: boolean): string {
  const pkgs = new Set<string>(["react", "react-dom"]);
  for (const p of DS_PROVIDER_PKGS[system] ?? []) pkgs.add(p);
  /* Discover the real component packages from the codegen's own imports. */
  for (const imp of collectImports(system as SystemId, allTypes)) {
    const m = imp.match(/from\s+"([^"]+)"/) ?? imp.match(/^import\s+"([^"]+)"/);
    const pkg = m ? packageOf(m[1]) : null;
    if (pkg) pkgs.add(pkg);
  }
  if (hasCharts) {
    pkgs.add("highcharts");
    pkgs.add("highcharts-react-official");
  }

  const dependencies: Record<string, string> = {};
  for (const p of [...pkgs].sort()) dependencies[p] = ver(p);

  const pkg = {
    name: PROJECT_NAME,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc -b && vite build",
      preview: "vite preview",
    },
    dependencies,
    devDependencies: {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      typescript: "^5.5.3",
      vite: "^5.3.4",
    },
  };

  return JSON.stringify(pkg, null, 2) + "\n";
}

const VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${PROJECT_NAME}</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

/* Minimal CSS for the simulated components used by reactExporter.
 * DS-agnostic token structure so the exported app runs out of the
 * box without needing the actual Salt / M3 / Fluent packages. */
const STYLES_CSS = `/* ── Design tokens - swap these with real DS imports when ready ── */
:root {
  --bg: #0b1120;
  --fg: #e7e2f7;
  --fg-muted: rgba(255, 255, 255, 0.6);
  --surface: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.1);
  --accent: #8A58C9;
  --accent-fg: #ffffff;
  --success: #4ade80;
  --warn: #facc15;
  --error: #f87171;
  --info: #60a5fa;
  --radius: 10px;
  --font: "Inter", system-ui, -apple-system, sans-serif;
}

/* Light mode */
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --fg: #15102a;
    --fg-muted: rgba(0, 0, 0, 0.6);
    --surface: rgba(0, 0, 0, 0.03);
    --border: rgba(0, 0, 0, 0.1);
    --accent: #6b57b0;
    --accent-fg: #ffffff;
  }
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: var(--font); background: var(--bg); color: var(--fg); min-height: 100vh; }
.app-root { max-width: 1280px; margin: 0 auto; padding: 24px; }

/* Layout */
.app-header, .app-footer { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
.app-footer { border-top: 1px solid var(--border); border-bottom: 0; color: var(--fg-muted); font-size: 13px; }
.app-body { display: grid; grid-template-columns: 220px 1fr; gap: 16px; padding: 16px 0; }
.app-sidebar { border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.app-main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-content: start; }

/* Primitives */
h1 { font-size: 28px; margin: 4px 0; letter-spacing: -0.02em; }
h2 { font-size: 20px; margin: 8px 0; letter-spacing: -0.01em; }
h3 { font-size: 16px; margin: 6px 0; }
h4 { font-size: 14px; margin: 4px 0; color: var(--fg-muted); font-weight: 500; }
label { display: block; font-size: 12px; font-weight: 500; color: var(--fg-muted); }

.btn { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 6px; border: 0; font-family: inherit; font-size: 14px; cursor: pointer; }
.btn-primary { background: var(--accent); color: var(--accent-fg); }
.btn-secondary { background: var(--surface); color: var(--fg); border: 1px solid var(--border); }
.btn-outline { background: transparent; color: var(--fg); border: 1px solid var(--border); }
.btn-ghost { background: transparent; color: var(--fg); }
.btn:hover { filter: brightness(1.1); }

.form-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.form-field input { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--fg); font-family: inherit; }

.card { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.stat-card { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.stat-label { display: block; font-size: 11px; font-weight: 600; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { display: block; font-size: 24px; font-weight: 700; margin: 4px 0; }
.progress-bar { height: 4px; background: var(--accent); border-radius: 2px; }

.alert { padding: 12px 16px; border-radius: var(--radius); border: 1px solid var(--border); }
.alert-info    { background: rgba(96, 165, 250, 0.1);  border-color: var(--info); }
.alert-success { background: rgba(74, 222, 128, 0.1);  border-color: var(--success); }
.alert-warning { background: rgba(250, 204, 21, 0.1);  border-color: var(--warn); }
.alert-error   { background: rgba(248, 113, 113, 0.1); border-color: var(--error); }

.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--surface); border: 1px solid var(--border); }

.progress { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); }
progress { width: 100%; height: 6px; }

.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
.tab { padding: 8px 12px; border: 0; background: transparent; color: var(--fg-muted); font-family: inherit; cursor: pointer; font-size: 13px; }
.tab:hover { color: var(--fg); }

.checkbox, .switch { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--fg); cursor: pointer; }
`;

/* uoaui is a CSS-only DS. reactExporter emits `import "./uoaui-theme.css"` as a
 * side-effect import, so an exported uoaui project must ship a matching
 * stylesheet. App.tsx lives in src/, so this file is written to
 * src/uoaui-theme.css and the relative import resolves. Compact, valid a-*
 * glassmorphism styles so the exported app renders out of the box. */
const UOAUI_THEME_CSS = `/* uoaui DS - glassmorphism theme tokens + a-* component styles */
:root {
  --a-bg: #0b1120;
  --a-fg: #e7e2f7;
  --a-fg-muted: rgba(231, 226, 247, 0.65);
  --a-surface: rgba(255, 255, 255, 0.06);
  --a-surface-strong: rgba(255, 255, 255, 0.12);
  --a-border: rgba(255, 255, 255, 0.16);
  --a-accent: #8a58c9;
  --a-accent-fg: #ffffff;
  --a-radius: 12px;
  --a-blur: blur(12px);
  --a-font: "Inter", system-ui, -apple-system, sans-serif;
}

@media (prefers-color-scheme: light) {
  :root {
    --a-bg: #f4f1fb;
    --a-fg: #15102a;
    --a-fg-muted: rgba(21, 16, 42, 0.65);
    --a-surface: rgba(255, 255, 255, 0.55);
    --a-surface-strong: rgba(255, 255, 255, 0.75);
    --a-border: rgba(21, 16, 42, 0.12);
  }
}

/* Buttons */
.a-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--a-radius);
  border: 1px solid var(--a-border);
  background: var(--a-surface);
  color: var(--a-fg);
  font-family: var(--a-font);
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: var(--a-blur);
  transition: filter 120ms ease, background 120ms ease;
}
.a-btn:hover { filter: brightness(1.08); }
.a-btn-primary { background: var(--a-accent); color: var(--a-accent-fg); border-color: transparent; }
.a-btn-secondary { background: var(--a-surface-strong); color: var(--a-fg); }
.a-btn-ghost { background: transparent; border-color: transparent; }
.a-btn-outline { background: transparent; }

/* Inputs */
.a-input-wrap { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
/* registry emits className="a-input-label" (componentApiRegistry uoaui input) */
.a-input-label { font-size: 12px; font-weight: 500; color: var(--a-fg-muted); }
.a-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--a-radius);
  border: 1px solid var(--a-border);
  background: var(--a-surface);
  color: var(--a-fg);
  font-family: var(--a-font);
  font-size: 14px;
  backdrop-filter: var(--a-blur);
}
.a-input:focus-visible { outline: 2px solid var(--a-accent); outline-offset: 1px; }

/* Card */
.a-card {
  padding: 16px;
  border-radius: var(--a-radius);
  border: 1px solid var(--a-border);
  background: var(--a-surface);
  color: var(--a-fg);
  backdrop-filter: var(--a-blur);
}

/* Checkbox */
.a-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--a-fg);
  cursor: pointer;
}
/* registry emits <label className="a-checkbox"><span className="a-cb-box">✓</span> ...,
   adding " checked" to the label className when checked — style the SPAN, not an input. */
.a-cb-box {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; flex-shrink: 0;
  border: 1px solid var(--a-border); border-radius: 4px;
  background: var(--a-surface); color: transparent;
  font-size: 11px; line-height: 1;
}
.a-checkbox.checked .a-cb-box { background: var(--a-accent); color: var(--a-accent-fg); border-color: transparent; }
`;

/* Human label + the npm packages installed for each DS, so the README can be
 * accurate about what's already in package.json for the active system. */
const DS_README: Record<string, { label: string; packages: string[]; cssOnly?: boolean }> = {
  salt: { label: "Salt DS", packages: ["@salt-ds/core", "@salt-ds/theme"] },
  m3: { label: "Material 3 (MUI)", packages: ["@mui/material", "@emotion/react", "@emotion/styled"] },
  fluent: { label: "Fluent 2", packages: ["@fluentui/react-components"] },
  carbon: { label: "Carbon DS", packages: ["@carbon/react", "@carbon/styles"] },
  uoaui: { label: "uoaui DS", packages: [], cssOnly: true },
};

function readmeMd(system: string, hasCharts: boolean): string {
  const info = DS_README[system] ?? DS_README.salt;

  const dsSection = info.cssOnly
    ? `## Design system — ${info.label}

This canvas uses **${info.label}**, a CSS-only design system. No runtime
package is required: the glassmorphism \`a-*\` styles ship in
\`src/uoaui-theme.css\` and are imported by \`src/App.tsx\`, so the app
renders out of the box.`
    : `## Design system — ${info.label}

The real **${info.label}** package${info.packages.length > 1 ? "s are" : " is"} already installed in
\`package.json\`, so the generated code in \`src/App.tsx\` runs against the
genuine DS API:

${info.packages.map((p) => `- \`${p}\``).join("\n")}

\`npm install\` pulls ${info.packages.length > 1 ? "them" : "it"} in automatically. The DS provider/theme
wrapper is already wired into \`src/App.tsx\`.`;

  const chartSection = hasCharts
    ? `

## Charts

This canvas contains chart blocks, so \`highcharts\` and
\`highcharts-react-official\` are installed too.`
    : "";

  return `# ${PROJECT_NAME}

This project was exported from Design Hub. It's a Vite + React + TypeScript
app with the canvas you built wired into \`src/App.tsx\` — running against the
real design-system package(s) for the system you selected.

## Quick start

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:5173.

${dsSection}${chartSection}

## What's inside

- \`src/App.tsx\` - your canvas, compiled to JSX (real DS components)
- \`src/styles.css\` - layout + fallback primitives for any uncovered blocks
${info.cssOnly ? "- `src/uoaui-theme.css` - uoaui glassmorphism theme + `a-*` styles\n" : ""}- \`vite.config.ts\` - Vite + React plugin
- \`tsconfig.json\` - strict TypeScript

Happy building.
`;
}

function appTsxSource(): string {
  // reactExporter's output is a full standalone component for src/App.tsx.
  // exportReact() ALREADY emits `import React from "react";` (and, when charts
  // are present, a leading `"use client";` that MUST stay the file's first line).
  // Do NOT prepend another React import here — it duplicates the identifier
  // (tsc: "Duplicate identifier 'React'") and displaces the directive.
  return `${exportReact()}\n`;
}

/** Safety caps - a generated Vite project should never exceed these
 *  in practice, but hard limits keep a malicious canvas from producing
 *  a multi-megabyte shell script that crashes the user's editor. */
const MAX_PROJECT_BYTES = 512 * 1024;  // 512KB cap on total script
const MAX_FILE_BYTES = 256 * 1024;     // 256KB per file

/**
 * The heredoc uses a QUOTED delimiter (<<'EOF_N'), which means bash
 * performs NO variable, command, or arithmetic substitution inside -
 * backticks, $(...), ${...}, etc. are literal text. The only way content
 * can break out of a quoted heredoc is if a line equals the delimiter
 * exactly. `uniqueDelim()` below guarantees the delimiter doesn't appear
 * in the file, so this function is effectively a defense-in-depth pass
 * plus a size cap - nothing else is needed for injection safety. */
function sanitizeForHeredoc(s: string, path = ""): string {
  if (s.length > MAX_FILE_BYTES) {
    // A mid-token slice of a code file does NOT compile (it cuts inside JSX or a
    // string and the appended comment lands in broken syntax). For source files
    // emit a VALID placeholder component so the project still builds; the
    // total-project cap (below) guards true multi-megabyte bloat. Non-code files
    // (CSS/MD) tolerate a marker comment.
    if (/\.(tsx|ts|jsx|js)$/.test(path)) {
      return `export default function App() {\n  return (\n    <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>\n      <h1>Export too large to inline</h1>\n      <p>This canvas exceeded the ${MAX_FILE_BYTES / 1024}KB per-file export limit. Re-export a smaller selection, or split the layout.</p>\n    </div>\n  );\n}\n`;
    }
    return s.slice(0, MAX_FILE_BYTES) + "\n/* ...truncated by Design Hub export (file exceeded size limit) ... */\n";
  }
  // Strip any NUL bytes (shouldn't appear but bash handles them oddly)
  return s.replace(/\0/g, "");
}

interface ProjectFile {
  path: string;
  contents: string;
}

/** Every block type across the four zones, one level deep into LayoutGroups —
 *  the input to both dep derivation (collectImports) and chart detection. */
function canvasBlockTypes(): string[] {
  const s = useBuilder.getState();
  const top = [...s.headerBlocks, ...s.sidebarBlocks, ...s.blocks, ...s.footerBlocks];
  const types: string[] = [];
  for (const b of top) {
    types.push(b.type);
    for (const c of b.children ?? []) types.push(c.type);
  }
  return types;
}

/** Charts need Highcharts deps. "SimulatedChart" or any "Highchart*" type. */
function hasChartBlocks(types: string[]): boolean {
  return types.some((t) => t === "SimulatedChart" || t.startsWith("Highchart"));
}

function buildProjectFiles(): ProjectFile[] {
  const state = useBuilder.getState();
  const allTypes = canvasBlockTypes();
  const hasCharts = hasChartBlocks(allTypes);

  const files: ProjectFile[] = [
    { path: "package.json",     contents: packageJson(state.designSystem, allTypes, hasCharts) },
    { path: "vite.config.ts",   contents: VITE_CONFIG },
    { path: "tsconfig.json",    contents: TSCONFIG },
    { path: "index.html",       contents: INDEX_HTML },
    { path: "README.md",        contents: readmeMd(state.designSystem, hasCharts) },
    { path: "src/main.tsx",     contents: MAIN_TSX },
    { path: "src/App.tsx",      contents: appTsxSource() },
    { path: "src/styles.css",   contents: STYLES_CSS },
  ];

  /* uoaui ships no JS package — reactExporter emits `import "./uoaui-theme.css"`,
     so the exported project must include that stylesheet for the app to render. */
  if (state.designSystem === "uoaui") {
    files.push({ path: "src/uoaui-theme.css", contents: UOAUI_THEME_CSS });
  }

  return files;
}

/** Build a unique heredoc delimiter for a given file's contents. */
function uniqueDelim(contents: string, i: number): string {
  let d = `EOF_${i}`;
  // Collision-avoidance - unlikely but cheap to check.
  while (contents.includes(`\n${d}\n`) || contents.startsWith(`${d}\n`) || contents.endsWith(`\n${d}`)) {
    d = `EOF_${i}_${Math.random().toString(36).slice(2, 6)}`;
  }
  return d;
}

/** Generate the self-extracting bootstrap shell script. */
export function exportViteBootstrap(): string {
  const files = buildProjectFiles();

  const state = useBuilder.getState();
  const header = `#!/bin/sh
# ─────────────────────────────────────────────────────────────────────
# Design Hub - Vite project bootstrap
# Generated: ${new Date().toISOString()}
# Design system: ${state.designSystem}
# Mode: ${state.mode}
# Total blocks: ${state.blocks.length + state.headerBlocks.length + state.sidebarBlocks.length + state.footerBlocks.length}
# ─────────────────────────────────────────────────────────────────────
# Run this script in an empty directory:
#   sh design-hub-project.sh
# It will create a folder "${PROJECT_NAME}/", populate it, and install deps.
# ─────────────────────────────────────────────────────────────────────
set -e

PROJECT_DIR="${PROJECT_NAME}"
if [ -d "$PROJECT_DIR" ]; then
  echo "Directory '$PROJECT_DIR' already exists. Remove it first or cd into a different folder."
  exit 1
fi

mkdir -p "$PROJECT_DIR/src"
cd "$PROJECT_DIR"

echo "→ Writing project files…"
`;

  const fileSections = files
    .map((f, i) => {
      const delim = uniqueDelim(f.contents, i);
      const safe = sanitizeForHeredoc(f.contents, f.path);
      // Use quoted heredoc ('EOF_N') so $ variables in the content are not expanded.
      return `
cat > "${f.path}" <<'${delim}'
${safe}${safe.endsWith("\n") ? "" : "\n"}${delim}
echo "  ✔ ${f.path}"`;
    })
    .join("\n");

  // Hard cap on total script size
  const provisional = header + fileSections;
  if (provisional.length > MAX_PROJECT_BYTES) {
    return `#!/bin/sh
# Error - the exported project exceeded ${MAX_PROJECT_BYTES / 1024}KB.
# This usually means the canvas has unusually large component content.
# Trim your canvas and try again, or use the React / HTML export for
# single-file output.
echo "Design Hub export too large (${provisional.length} bytes)"
exit 1
`;
  }

  const footer = `

echo ""
echo "→ Installing dependencies (this can take a minute)…"
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
elif command -v yarn >/dev/null 2>&1; then
  yarn install
else
  npm install
fi

echo ""
echo "✔ Done. Next steps:"
echo "  cd ${PROJECT_NAME}"
echo "  npm run dev"
echo ""
`;

  return header + fileSections + footer;
}

/** Returns a deterministic filename for the bootstrap script. */
export function viteBootstrapFilename(): string {
  return `${PROJECT_NAME}.sh`;
}
