"use client";

import React, { useState, useCallback } from "react";
import { exportReact } from "@/lib/export/reactExporter";
import { exportHTML } from "@/lib/export/htmlExporter";

type ExportFormat = "react" | "html";

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>("react");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const output = format === "react" ? exportReact() : exportHTML();
    setCode(output);
    setCopied(false);
  }, [format]);

  const copyToClipboard = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const download = useCallback(() => {
    if (!code) return;
    const ext = format === "react" ? "tsx" : "html";
    const mime = format === "react" ? "text/typescript" : "text/html";
    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, format]);

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal-header">
          <span className="export-modal-title">Export Code</span>
          <button className="export-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Format picker */}
        <div className="export-format-row">
          <button
            className={`export-format-btn ${format === "react" ? "active" : ""}`}
            onClick={() => { setFormat("react"); setCode(""); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span>
            React (TSX)
          </button>
          <button
            className={`export-format-btn ${format === "html" ? "active" : ""}`}
            onClick={() => { setFormat("html"); setCode(""); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>language</span>
            HTML
          </button>
        </div>

        {/* Generate button */}
        <button className="export-generate-btn" onClick={generate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>magic_button</span>
          Generate {format === "react" ? "React Component" : "HTML Page"}
        </button>

        {/* Code preview */}
        {code && (
          <>
            <div className="export-code-wrapper">
              <pre className="export-code-pre">{code}</pre>
            </div>

            {/* Actions */}
            <div className="export-actions">
              <button className="export-action-btn" onClick={copyToClipboard}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button className="export-action-btn" onClick={download}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                Download .{format === "react" ? "tsx" : "html"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
