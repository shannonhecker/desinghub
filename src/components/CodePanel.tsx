"use client";

import React, { useState } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getSystemInfo } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";
import { SALT_CODE } from "@/data/salt/code-snippets";
import { M3_CODE } from "@/data/m3/code-snippets";
import { FLUENT_CODE } from "@/data/fluent/code-snippets";
import { AUSOS_CODE } from "@/data/ausos/code-snippets";
import { CARBON_CODE } from "@/data/carbon/code-snippets";

/* Per-DS metadata used by the fallback renderer when a registered
   component has no authored snippet yet. Keeps the Code panel useful
   even for newly-added entries instead of dead-ending at "coming soon". */
const SYSTEM_PACKAGES: Record<string, { pkg: string; docsUrl: string; componentBase: string }> = {
  salt:   { pkg: "@salt-ds/core",              docsUrl: "https://www.saltdesignsystem.com/salt/components/", componentBase: "https://www.saltdesignsystem.com/salt/components/" },
  m3:     { pkg: "@mui/material",              docsUrl: "https://m3.material.io/components",                 componentBase: "https://mui.com/material-ui/react-" },
  fluent: { pkg: "@fluentui/react-components", docsUrl: "https://react.fluentui.dev/",                       componentBase: "https://react.fluentui.dev/?path=/docs/components-" },
  ausos:  { pkg: "@ausos/core",                docsUrl: "#",                                                  componentBase: "#" },
  carbon: { pkg: "@carbon/react",              docsUrl: "https://carbondesignsystem.com/components/",         componentBase: "https://react.carbondesignsystem.com/?path=/docs/components-" },
};

/* ═══════════════════════════════════════════════════════════
   Code Block - single-pass tokenizer, CSS class highlighting
   ═══════════════════════════════════════════════════════════ */
function CodeBlock({ code, theme: t, cardClass }: { code: string; theme: ReturnType<typeof useActiveTheme>; cardClass: string }) {
  const [copied, setCopied] = useState(false);
  const [tokenToast, setTokenToast] = useState<string | null>(null);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Event-delegated click on any `.syn-token-copyable` span inside the
     code block copies its data-token value. Powers the click-to-copy
     affordance on `var(--...)` references — users can grab the token
     name without selecting it by hand. */
  const onCodeClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("syn-token-copyable")) return;
    const token = target.getAttribute("data-token");
    if (!token) return;
    navigator.clipboard.writeText(token);
    setTokenToast(token);
    setTimeout(() => setTokenToast(null), 2000);
  };

  /* Single-pass tokenizer - avoids cascading regex corruption */
  const escaped = code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const tokenRe = /(\/\/[^\n]+|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|(\b(?:import|from|const|let|function|return|export|default|type|interface)\b)|(&lt;\/?[A-Z]\w*)|(\b\w+)(?==)/g;

  let highlighted = "";
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(escaped)) !== null) {
    highlighted += escaped.slice(lastIdx, m.index);
    if (m[1])      highlighted += `<span class="syn-comment">${m[1]}</span>`;
    else if (m[2]) highlighted += `<span class="syn-string">${m[2]}</span>`;
    else if (m[3]) highlighted += `<span class="syn-keyword">${m[3]}</span>`;
    else if (m[4]) highlighted += `<span class="syn-component">${m[4]}</span>`;
    else if (m[5]) highlighted += `<span class="syn-prop">${m[5]}</span>`;
    lastIdx = tokenRe.lastIndex;
  }
  highlighted += escaped.slice(lastIdx);

  /* Second pass: wrap CSS-var references so they become clickable.
     Runs AFTER highlighting so nested token refs inside strings still
     get interactivity (nested spans are valid HTML). */
  highlighted = highlighted.replace(
    /\bvar\(--[a-zA-Z0-9_-]+\)/g,
    (match) => `<span class="syn-token-copyable" data-token="${match.replace(/"/g, "&quot;")}">${match}</span>`
  );

  const btnCls = t.activeSystem === "salt" ? "s-btn s-btn-bordered" : t.activeSystem === "m3" ? "m3-btn m3-btn-outlined" : t.activeSystem === "ausos" ? "a-btn a-btn-secondary" : "f-btn f-btn-secondary";

  // Detect light theme - if bg luminance is high, use light syntax colors
  const isLight = (() => {
    const bg = t.bg;
    if (!bg || bg.startsWith("rgba") || bg.startsWith("transparent")) return true;
    const hex = bg.replace("#", "");
    if (hex.length !== 6) return false;
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.5;
  })();

  return (
    <div className={`${cardClass}${isLight ? " syn-light" : ""}`} style={{
      position: "relative", overflow: "hidden", cursor: "default",
    }}>
      <button className={btnCls} onClick={copy} aria-label="Copy code" style={{
        position: "absolute", top: 8, right: 8, padding: "4px 10px",
        fontSize: 11, minWidth: "auto", minHeight: 24, zIndex: 2,
        background: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}>
        <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
      </button>
      <pre aria-label="Code example" style={{
        padding: 16, margin: 0, overflow: "auto", fontSize: 12, lineHeight: 1.6,
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        color: isLight ? "#24292f" : t.fg,
      }}>
        <code onClick={onCodeClick} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      {tokenToast && (
        <div role="status" aria-live="polite" style={{
          position: "absolute", bottom: 8, right: 8,
          padding: "6px 10px", fontSize: 11, fontFamily: "'SF Mono', 'Fira Code', monospace",
          background: isLight ? "rgba(36,41,47,0.92)" : "rgba(255,255,255,0.92)",
          color: isLight ? "#ffffff" : "#24292f",
          borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.25)", zIndex: 3,
          pointerEvents: "none",
        }}>
          Copied {tokenToast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CodePanel - entry point
   ═══════════════════════════════════════════════════════════ */
export function CodePanel({ componentId }: { componentId: string }) {
  const { activeSystem } = useDesignHub();
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  const sysInfo = getSystemInfo(activeSystem);

  const codeMap = activeSystem === "salt" ? SALT_CODE
    : activeSystem === "m3" ? M3_CODE
    : activeSystem === "ausos" ? AUSOS_CODE
    : activeSystem === "carbon" ? CARBON_CODE
    : FLUENT_CODE;
  const snippets = codeMap[componentId];

  /* DS card class for code block containers */
  const cardCls = activeSystem === "salt" ? "s-card"
    : activeSystem === "m3" ? "m3-card"
    : activeSystem === "ausos" ? "a-card"
    : activeSystem === "carbon" ? "cb-tile"
    : "f-card";

  /* ── Fallback for registered components with no authored snippet ──
     Rather than a dead-end "coming soon" message, we render a minimal
     skeleton: the DS package import, a placeholder component call, and
     a link to the official docs. Users can still copy-paste a working
     starting point instead of getting an empty panel. */
  if (!snippets) {
    const meta = SYSTEM_PACKAGES[activeSystem] ?? SYSTEM_PACKAGES.salt;
    const pascal = comp?.name?.replace(/[^A-Za-z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^([a-z])/, (_, c) => c.toUpperCase()) ?? "Component";
    const fallbackReact = `// ${comp?.name ?? "Component"} - authored snippet coming soon
// This skeleton shows the DS package import + component shape.
// See ${meta.docsUrl} for the full API reference.
import { ${pascal} } from "${meta.pkg}";

export function Example() {
  return (
    <${pascal}>
      {/* Children / props - see the docs for this component's API */}
    </${pascal}>
  );
}`;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            padding: 16,
            background: t.bg2,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            fontSize: 13,
            color: t.fg2,
            fontFamily: t.font,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18 }} aria-hidden>[i]</span>
          <span>
            Authored code snippet for <strong style={{ color: t.fg }}>{comp?.name}</strong> is
            pending. Below is a minimal skeleton - check the{" "}
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: t.accent, textDecoration: "underline" }}
            >
              {sysInfo.name} docs
            </a>{" "}
            for the full API.
          </span>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 12, fontFamily: t.font }}>
            React + TypeScript (skeleton)
          </h3>
          <CodeBlock code={fallbackReact} theme={t} cardClass={cardCls} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* React + TypeScript */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 12, fontFamily: t.font }}>
          React + TypeScript
        </h3>
        <CodeBlock code={snippets.react} theme={t} cardClass={cardCls} />
      </div>

      {/* HTML + CSS */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 12, fontFamily: t.font }}>
          HTML + CSS
        </h3>
        <CodeBlock code={snippets.html} theme={t} cardClass={cardCls} />
      </div>
    </div>
  );
}
