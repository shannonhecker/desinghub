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

const PROJECT_NAME = "design-hub-app";

const PACKAGE_JSON = `{
  "name": "${PROJECT_NAME}",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
`;

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
const STYLES_CSS = `/* ── Design tokens — swap these with real DS imports when ready ── */
:root {
  --bg: #0b1120;
  --fg: #e7e2f7;
  --fg-muted: rgba(255, 255, 255, 0.6);
  --surface: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.1);
  --accent: #7e6bc4;
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

const README_MD = `# ${PROJECT_NAME}

This project was exported from Design Hub. It's a minimal Vite + React +
TypeScript starter with the canvas you built wired into \`src/App.tsx\`.

## Quick start

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:5173.

## Next steps

The exported styles use design-system-agnostic CSS tokens in
\`src/styles.css\` so the app runs out of the box. When you're ready
to adopt a real DS, swap these for the DS package imports:

- **Salt DS**: \`npm install @salt-ds/core @salt-ds/theme\`
- **Material 3**: \`npm install @mui/material @emotion/react @emotion/styled\`
- **Fluent 2**: \`npm install @fluentui/react-components\`

Then replace the root wrapper in \`src/main.tsx\` with the DS's provider
component.

## What's inside

- \`src/App.tsx\` — your canvas, compiled to JSX
- \`src/styles.css\` — DS-agnostic tokens + component primitives
- \`vite.config.ts\` — Vite + React plugin
- \`tsconfig.json\` — strict TypeScript

Happy building.
`;

function appTsxSource(): string {
  // reactExporter's output is a full standalone component; wrap it as src/App.tsx.
  // exportReact() already emits 'export default function App() { ... }' so we keep it
  // and prepend the React import + styles import.
  const componentSource = exportReact();
  return `import React from "react";\n\n${componentSource}\n`;
}

/** Safety caps — a generated Vite project should never exceed these
 *  in practice, but hard limits keep a malicious canvas from producing
 *  a multi-megabyte shell script that crashes the user's editor. */
const MAX_PROJECT_BYTES = 512 * 1024;  // 512KB cap on total script
const MAX_FILE_BYTES = 256 * 1024;     // 256KB per file

/**
 * The heredoc uses a QUOTED delimiter (<<'EOF_N'), which means bash
 * performs NO variable, command, or arithmetic substitution inside —
 * backticks, $(...), ${...}, etc. are literal text. The only way content
 * can break out of a quoted heredoc is if a line equals the delimiter
 * exactly. `uniqueDelim()` below guarantees the delimiter doesn't appear
 * in the file, so this function is effectively a defense-in-depth pass
 * plus a size cap — nothing else is needed for injection safety. */
function sanitizeForHeredoc(s: string): string {
  if (s.length > MAX_FILE_BYTES) {
    // Truncate with a visible marker — far better than a broken project
    return s.slice(0, MAX_FILE_BYTES) + "\n/* ...truncated by Design Hub export (file exceeded size limit) ... */\n";
  }
  // Strip any NUL bytes (shouldn't appear but bash handles them oddly)
  return s.replace(/\0/g, "");
}

interface ProjectFile {
  path: string;
  contents: string;
}

function buildProjectFiles(): ProjectFile[] {
  return [
    { path: "package.json",     contents: PACKAGE_JSON },
    { path: "vite.config.ts",   contents: VITE_CONFIG },
    { path: "tsconfig.json",    contents: TSCONFIG },
    { path: "index.html",       contents: INDEX_HTML },
    { path: "README.md",        contents: README_MD },
    { path: "src/main.tsx",     contents: MAIN_TSX },
    { path: "src/App.tsx",      contents: appTsxSource() },
    { path: "src/styles.css",   contents: STYLES_CSS },
  ];
}

/** Build a unique heredoc delimiter for a given file's contents. */
function uniqueDelim(contents: string, i: number): string {
  let d = `EOF_${i}`;
  // Collision-avoidance — unlikely but cheap to check.
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
# Design Hub — Vite project bootstrap
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
      const safe = sanitizeForHeredoc(f.contents);
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
# Error — the exported project exceeded ${MAX_PROJECT_BYTES / 1024}KB.
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
