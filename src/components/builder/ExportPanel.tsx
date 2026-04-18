"use client";

import React, { useState, useCallback } from "react";
import { exportReact } from "@/lib/export/reactExporter";
import { exportHTML } from "@/lib/export/htmlExporter";
import { exportViteBootstrap, viteBootstrapFilename } from "@/lib/export/viteExporter";

type ExportFormat = "react" | "html" | "vite";

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>("react");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const output =
      format === "react" ? exportReact()
      : format === "html" ? exportHTML()
      : exportViteBootstrap();
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
    let filename: string;
    let mime: string;
    if (format === "react") {
      filename = "dashboard.tsx";
      mime = "text/typescript";
    } else if (format === "html") {
      filename = "dashboard.html";
      mime = "text/html";
    } else {
      filename = viteBootstrapFilename();
      mime = "application/x-sh";
    }
    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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
          <button
            className={`export-format-btn ${format === "vite" ? "active" : ""}`}
            onClick={() => { setFormat("vite"); setCode(""); }}
            title="Self-extracting shell script - run `sh design-hub-app.sh` to bootstrap a working Vite + React + TS project"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_zip</span>
            Vite project
          </button>
        </div>

        {/* Generate button */}
        <button className="export-generate-btn" onClick={generate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>magic_button</span>
          Generate {
            format === "react" ? "React Component"
            : format === "html" ? "HTML Page"
            : "Vite Project Bootstrap"
          }
        </button>

        {format === "vite" && code && (
          <p className="export-helper-note">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>terminal</span>
            Download the script, then run <code>sh design-hub-app.sh</code> in an empty folder to bootstrap a working Vite + React + TS project.
          </p>
        )}

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
                Download {
                  format === "react" ? ".tsx"
                  : format === "html" ? ".html"
                  : ".sh"
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
