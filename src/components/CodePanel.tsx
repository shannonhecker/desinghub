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
function CodeBlock({ code, theme: t }: { code: string; theme: ReturnType<typeof useActiveTheme> }) {
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

  return (
    <div style={{
      background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8,
      position: "relative", overflow: "hidden",
    }}>
      <button onClick={copy} style={{
        position: "absolute", top: 8, right: 8, padding: "4px 10px",
        borderRadius: 4, border: `1px solid ${t.border}`, background: t.bg3,
        color: t.fg2, fontSize: 11, cursor: "pointer",
      }}>
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre style={{
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
  const [codeTab, setCodeTab] = useState<"react" | "html">("react");
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  const sysInfo = getSystemInfo(activeSystem);

  const codeMap = activeSystem === "salt" ? SALT_CODE : activeSystem === "m3" ? M3_CODE : FLUENT_CODE;
  const snippets = codeMap[componentId];

  /* DS-scoped tab + button classes */
  const tabCls = activeSystem === "salt" ? "s-tab" : activeSystem === "m3" ? "m3-tab" : "f-tab";
  const btnCls = activeSystem === "salt" ? "s-btn s-btn-transparent" : activeSystem === "m3" ? "m3-btn m3-btn-text" : "f-btn f-btn-subtle";

  return (
    <div style={{ padding: t.scale.gap * 4, fontFamily: t.font }}>
      <button
        className={btnCls}
        onClick={() => useDesignHub.getState().setSelectedComponent(null)}
        style={{ fontSize: t.scale.navF, color: t.accent, marginBottom: t.scale.gap * 2, cursor: "pointer" }}
      >
        ← Back to all
      </button>
      <h2 style={{ fontSize: t.scale.navF + 6, fontWeight: 700, color: t.fg, margin: `0 0 ${t.scale.gap}px` }}>
        {comp?.name} — Code
      </h2>
      <p style={{ fontSize: t.scale.navF, color: t.fg2, margin: `0 0 ${t.scale.gap * 3}px` }}>
        {sysInfo.name} implementation with correct imports and API
      </p>

      {snippets ? (
        <>
          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, marginBottom: t.scale.gap * 2 }}>
            {(["react", "html"] as const).map((tab) => (
              <button
                key={tab}
                className={`${tabCls}${codeTab === tab ? " active" : ""}`}
                onClick={() => setCodeTab(tab)}
                style={{ fontFamily: t.font, fontSize: t.scale.navF }}
              >
                {tab === "react" ? "React + TypeScript" : "HTML + CSS"}
              </button>
            ))}
          </div>
          <CodeBlock code={snippets[codeTab]} theme={t} />
        </>
      ) : (
        <div style={{
          padding: t.scale.gap * 4, textAlign: "center",
          color: t.fg3, fontSize: t.scale.navF,
          border: `1px dashed ${t.border}`, borderRadius: 8,
        }}>
          Code snippets for <strong style={{ color: t.fg }}>{comp?.name}</strong> coming soon.
          <br />
          <span>Check the {sysInfo.name} documentation for current API reference.</span>
        </div>
      )}
    </div>
  );
}
