"use client";

import React, { useState } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getSystemInfo } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";
import { SALT_CODE } from "@/data/salt/code-snippets";
import { M3_CODE } from "@/data/m3/code-snippets";
import { FLUENT_CODE } from "@/data/fluent/code-snippets";

/* ═══════════════════════════════════════════════════════════
   Code Block — single-pass tokenizer, CSS class highlighting
   ═══════════════════════════════════════════════════════════ */
function CodeBlock({ code, theme: t, cardClass }: { code: string; theme: ReturnType<typeof useActiveTheme>; cardClass: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Single-pass tokenizer — avoids cascading regex corruption */
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

  const btnCls = t.activeSystem === "salt" ? "s-btn s-btn-bordered" : t.activeSystem === "m3" ? "m3-btn m3-btn-outlined" : "f-btn f-btn-secondary";

  return (
    <div className={cardClass} style={{
      position: "relative", overflow: "hidden", cursor: "default",
    }}>
      <button className={btnCls} onClick={copy} aria-label="Copy code" style={{
        position: "absolute", top: 8, right: 8, padding: "4px 10px",
        fontSize: 11, minWidth: "auto", minHeight: 24,
      }}>
        <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
      </button>
      <pre aria-label="Code example" style={{
        padding: 16, margin: 0, overflow: "auto", fontSize: 12, lineHeight: 1.6,
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        color: t.fg,
      }}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CodePanel — entry point
   ═══════════════════════════════════════════════════════════ */
export function CodePanel({ componentId }: { componentId: string }) {
  const { activeSystem } = useDesignHub();
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  const sysInfo = getSystemInfo(activeSystem);

  const codeMap = activeSystem === "salt" ? SALT_CODE : activeSystem === "m3" ? M3_CODE : FLUENT_CODE;
  const snippets = codeMap[componentId];

  /* DS card class for code block containers */
  const cardCls = activeSystem === "salt" ? "s-card" : activeSystem === "m3" ? "m3-card" : "f-card";

  if (!snippets) {
    return (
      <div style={{
        padding: t.scale.gap * 4, textAlign: "center",
        color: t.fg3, fontSize: t.scale.navF,
        border: `1px dashed ${t.border}`, borderRadius: 8,
      }}>
        Code snippets for <strong style={{ color: t.fg }}>{comp?.name}</strong> coming soon.
        <br />
        <span>Check the {sysInfo.name} documentation for current API reference.</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap * 3 }}>
      {/* React + TypeScript */}
      <div>
        <h3 style={{ fontSize: t.scale.navF, fontWeight: 600, color: t.fg, marginBottom: t.scale.gap, fontFamily: t.font }}>
          React + TypeScript
        </h3>
        <CodeBlock code={snippets.react} theme={t} cardClass={cardCls} />
      </div>

      {/* HTML + CSS */}
      <div>
        <h3 style={{ fontSize: t.scale.navF, fontWeight: 600, color: t.fg, marginBottom: t.scale.gap, fontFamily: t.font }}>
          HTML + CSS
        </h3>
        <CodeBlock code={snippets.html} theme={t} cardClass={cardCls} />
      </div>
    </div>
  );
}
