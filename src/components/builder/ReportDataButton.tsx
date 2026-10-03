"use client";

import React, { useEffect, useRef, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { BUILDER_TEMPLATES, type BuilderTemplate } from "@/lib/builderTemplates";
import { sampleDataset } from "@/lib/reportData/registry";
import { downloadWorkbook, readWorkbook } from "@/lib/reportData/workbookFile";
import type { WorkbookImport } from "@/lib/reportData/workbook";
import { showToast } from "@/lib/toast";

/* ══════════════════════════════════════════════════════════
   ReportDataButton - swap a report's sample data for real data.

   Shown only when the template on the canvas is data-bound.
   "Download data template" saves an Excel workbook (one sheet
   per table, filled with the sample data, plus a Guide sheet);
   "Upload your data" reads it back and re-renders every bound
   grid and chart on the user's figures. The file is read in the
   browser and kept with the session; it is never sent anywhere.
   ══════════════════════════════════════════════════════════ */

/** What was loaded and what needs attention, as a chat message. */
function importSummary(result: WorkbookImport, allTables: string[]): string {
  const lines: string[] = [];
  if (result.dataset) {
    lines.push(`**Loaded your data.** ${result.imported.map((i) => `${i.table}: ${i.rows.toLocaleString("en-GB")} rows`).join(", ")}.`);
    /* Say which panels are still on sample figures, so a demo is not
       mistaken for being entirely the user's data. */
    const loaded = new Set(result.imported.map((i) => i.table));
    const sample = allTables.filter((t) => !loaded.has(t));
    if (sample.length) lines.push("", `Still using sample data: ${sample.join(", ")}. Panels built on those sheets show sample figures until you upload them too.`);
  } else {
    lines.push("**That workbook could not be loaded.** The report is still showing the data it had.");
  }
  const errors = result.issues.filter((i) => i.level === "error");
  const warnings = result.issues.filter((i) => i.level === "warning");
  const line = (i: WorkbookImport["issues"][number]) => `- ${i.sheet ? `${i.sheet}: ` : ""}${i.message}`;
  if (errors.length) lines.push("", result.dataset ? "Not loaded (the sample data is kept for these):" : "Why:", ...errors.map(line));
  if (warnings.length) lines.push("", "Worth checking:", ...warnings.map(line));
  return lines.join("\n");
}

export function ReportDataButton() {
  const templateId = useBuilder((s) => s.activeTemplateId);
  const uploaded = useBuilder((s) => s.reportData);
  const setReportData = useBuilder((s) => s.setReportData);
  const addMessage = useBuilder((s) => s.addMessage);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const template = templateId ? (BUILDER_TEMPLATES as Record<string, BuilderTemplate | undefined>)[templateId] : undefined;
  const sample = sampleDataset(template?.datasetId);
  if (!sample) return null;

  const download = async () => {
    setOpen(false);
    setBusy(true);
    try {
      /* The template is always the sample workbook: a known-good example to
         overwrite, whatever is loaded right now. */
      await downloadWorkbook(sample);
      showToast("Data template downloaded", { icon: "download", durationMs: 4000 });
    } catch {
      showToast("Couldn't create the data template. Try again.", { icon: "error", durationMs: 6000 });
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await readWorkbook(sample, file);
      if (result.dataset) setReportData(result.dataset);
      addMessage("ai", importSummary(result, sample.tables.map((t) => t.label)));
      const warnings = result.issues.length;
      showToast(
        result.dataset
          ? `Your data is loaded${warnings ? ` (${warnings} note${warnings > 1 ? "s" : ""} in chat)` : ""}`
          : "That workbook could not be loaded. Details are in the chat.",
        { icon: result.dataset ? "check_circle" : "error", durationMs: 6000 },
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => {
    setOpen(false);
    const previous = uploaded;
    setReportData(null);
    showToast("Back to the sample data", {
      icon: "restart_alt",
      durationMs: 6000,
      action: previous ? { label: "Undo", onClick: () => setReportData(previous) } : undefined,
    });
  };

  return (
    <div className="preview-bar-overflow-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`preview-bar-btn${open ? " preview-bar-btn-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={busy}
        title="Use your own data in this report"
      >
        <span className="material-symbols-outlined preview-bar-btn-glyph" aria-hidden="true">table_view</span>
        {uploaded ? "Your data" : "Sample data"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="dh-visually-hidden"
        aria-label="Upload a data workbook"
        tabIndex={-1}
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      {open && (
        <div className="preview-bar-overflow" role="menu" aria-label="Report data">
          <div className="preview-bar-overflow-group-label" aria-hidden="true">
            {uploaded ? "Showing your uploaded data" : "Showing sample data"}
          </div>
          <button type="button" className="preview-bar-overflow-item" role="menuitem" onClick={() => void download()} disabled={busy}>
            <span className="material-symbols-outlined" aria-hidden="true">download</span>
            Download data template (.xlsx)
          </button>
          <button
            type="button"
            className="preview-bar-overflow-item"
            role="menuitem"
            disabled={busy}
            onClick={() => { setOpen(false); fileRef.current?.click(); }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">upload</span>
            Upload your data…
          </button>
          {uploaded && (
            <>
              <div className="preview-bar-overflow-divider" />
              <button type="button" className="preview-bar-overflow-item" role="menuitem" onClick={reset}>
                <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
                Use the sample data again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
