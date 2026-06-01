"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { exportReact } from "@/lib/export/reactExporter";
import { exportHTML } from "@/lib/export/htmlExporter";
import { exportViteBootstrap, viteBootstrapFilename } from "@/lib/export/viteExporter";
import { exportSvg } from "@/lib/export/svgExporter";
import { exportFigmaSvg } from "@/lib/export/figmaSvgExporter";

type ExportFormat = "react" | "html" | "vite" | "svg" | "figma";

/* exportFigmaSvg() measures the live DOM and returns null when no canvas is
   mounted. Surface a clear guard in the preview area instead of a broken
   download. */
const FIGMA_GUARD = "Open Preview first, then export to Figma.";

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>("react");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  /* True when the current `code` is a guard message, not real output — used to
     disable Copy/Download so the user can't save the message as a file. */
  const [isGuard, setIsGuard] = useState(false);

  const generate = useCallback(() => {
    if (format === "figma") {
      const out = exportFigmaSvg();
      if (out === null) {
        setCode(FIGMA_GUARD);
        setIsGuard(true);
        setCopied(false);
        return;
      }
      setCode(out);
      setIsGuard(false);
      setCopied(false);
      return;
    }
    const output =
      format === "react" ? exportReact()
      : format === "html" ? exportHTML()
      : format === "svg" ? exportSvg()
      : exportViteBootstrap();
    setCode(output);
    setIsGuard(false);
    setCopied(false);
  }, [format]);

  const selectFormat = useCallback((next: ExportFormat) => {
    setFormat(next);
    setCode("");
    setIsGuard(false);
    setCopied(false);
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!code || isGuard) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code, isGuard]);

  /* Modal a11y: this overlay was a plain div with no dialog semantics — no
     role/aria-modal, no focus management, no Esc. Make it a real dialog:
     move focus in on open (so screen-reader users are told it opened),
     trap Tab inside it, close on Escape, and restore focus to the trigger
     on unmount. */
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = modalRef.current;
    if (!node) return;
    node.focus();
    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const download = useCallback(() => {
    if (!code || isGuard) return;
    let filename: string;
    let mime: string;
    if (format === "react") {
      filename = "dashboard.tsx";
      mime = "text/typescript";
    } else if (format === "html") {
      filename = "dashboard.html";
      mime = "text/html";
    } else if (format === "svg") {
      filename = "dashboard.svg";
      mime = "image/svg+xml";
    } else if (format === "figma") {
      filename = "dashboard-figma.svg";
      mime = "image/svg+xml";
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
  }, [code, format, isGuard]);

  return (
    <div className="export-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="export-modal-header">
          <span className="export-modal-title" id="export-modal-title">Export Code</span>
          <button className="export-modal-close" onClick={onClose} aria-label="Close export">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Format picker */}
        <div className="export-format-row">
          <button
            className={`export-format-btn ${format === "react" ? "active" : ""}`}
            onClick={() => selectFormat("react")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span>
            React (TSX)
          </button>
          <button
            className={`export-format-btn ${format === "html" ? "active" : ""}`}
            onClick={() => selectFormat("html")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>language</span>
            HTML
          </button>
          <button
            className={`export-format-btn ${format === "vite" ? "active" : ""}`}
            onClick={() => selectFormat("vite")}
            title="Self-extracting shell script - run `sh design-hub-app.sh` to bootstrap a working Vite + React + TS project"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_zip</span>
            Vite project
          </button>
          <button
            className={`export-format-btn ${format === "svg" ? "active" : ""}`}
            onClick={() => selectFormat("svg")}
            title="Wireframe / medium-fidelity vector SVG of the canvas. Figma-editable layers. Always available - reads the builder store, no Preview needed."
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shapes</span>
            SVG
          </button>
          <button
            className={`export-format-btn ${format === "figma" ? "active" : ""}`}
            onClick={() => selectFormat("figma")}
            title="Pixel-accurate SVG measured from the live canvas. Drag onto a Figma canvas - imports as editable layers. Requires Preview to be open."
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>design_services</span>
            Figma (SVG)
          </button>
        </div>

        {/* Generate button */}
        <button className="export-generate-btn" onClick={generate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>magic_button</span>
          Generate {
            format === "react" ? "React Component"
            : format === "html" ? "HTML Page"
            : format === "svg" ? "Wireframe SVG"
            : format === "figma" ? "Figma SVG"
            : "Vite Project Bootstrap"
          }
        </button>

        {format === "vite" && code && (
          <p className="export-helper-note">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>terminal</span>
            Download the script, then run <code>sh design-hub-app.sh</code> in an empty folder to bootstrap a working Vite + React + TS project.
          </p>
        )}

        {format === "svg" && code && (
          <p className="export-helper-note">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>info</span>
            Wireframe / medium-fidelity vector. Reproduces canvas regions and component silhouettes, not the exact live layout. Drag the <code>.svg</code> into Figma: each block imports as an editable layer.
          </p>
        )}

        {format === "figma" && code && isGuard && (
          <p className="export-helper-note">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>visibility</span>
            {FIGMA_GUARD} It measures the rendered canvas, so the Preview / Present view must be on screen.
          </p>
        )}

        {format === "figma" && code && !isGuard && (
          <p className="export-helper-note">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>design_services</span>
            Pixel-accurate, measured from the live canvas. Download the <code>.svg</code> and drag it onto a Figma canvas: it imports as editable layers, no plugin needed.
          </p>
        )}

        {/* Code preview — hidden when the output is just a guard message
            (e.g. Figma with no canvas mounted); the helper note above carries
            the instruction instead of a broken download. */}
        {code && !isGuard && (
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
                  : format === "svg" || format === "figma" ? ".svg"
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
