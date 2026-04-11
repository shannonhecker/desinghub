"use client";

import React, { useState } from "react";
import { useBuilder } from "@/store/useBuilder";

export function ExportActions() {
  const { designSystem, mode, density, interfaceType, selectedComponents, colorOverrides } = useBuilder();
  const [downloading, setDownloading] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "connecting" | "done">("idle");

  const handleDownload = () => {
    setDownloading(true);

    // Generate a config JSON as the "package"
    const config = {
      designSystem,
      mode,
      density,
      interfaceType,
      selectedComponents,
      colorOverrides,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${interfaceType}-${designSystem}-config.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 1500);
  };

  const handlePush = () => {
    setPushStatus("connecting");
    // Simulate GitHub auth flow
    setTimeout(() => setPushStatus("done"), 2000);
    setTimeout(() => setPushStatus("idle"), 4000);
  };

  return (
    <div className="export-bar">
      <button className="b-btn b-btn-primary b-btn-sm" onClick={handleDownload} disabled={downloading}>
        {downloading ? "Packaging..." : "⬇ Download"}
      </button>

      <button className="b-btn b-btn-secondary b-btn-sm" onClick={handlePush} disabled={pushStatus !== "idle"}>
        {pushStatus === "connecting" ? "Connecting..." : pushStatus === "done" ? "✓ Pushed!" : "⬆ Push to Repo"}
      </button>

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 11, color: "var(--b-fg3)" }}>
        {designSystem.toUpperCase()} · {interfaceType} · {selectedComponents.length} components
      </span>
    </div>
  );
}
