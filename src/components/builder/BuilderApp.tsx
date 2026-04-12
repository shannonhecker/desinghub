"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem, BuilderMode, InterfaceType } from "@/store/useBuilder";
import { useCloudStorage } from "@/lib/firebase";
import type { SavedProject } from "@/lib/firebase";
import { GeminiSidebar } from "./GeminiSidebar";
import { ChatPanel } from "./ChatPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PreviewSidePanel, StandalonePreview } from "./PreviewPanel";
import "./builder.css";

const WaveScene = dynamic(
  () => import("./WaveHero").then((m) => m.WaveScene),
  { ssr: false }
);

export function BuilderApp() {
  const {
    mode, previewOpen, togglePreview, setMode, clearChat,
    designSystem, interfaceType, selectedComponents, colorOverrides, density,
    setDesignSystem, setInterfaceType, setSelectedComponents,
    chatOpen: isChatOpen,
  } = useBuilder();

  const [isStandalone, setIsStandalone] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  // ── Gemini sidebar ──
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── My Projects modal ──
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [saveStep, setSaveStep] = useState<"idle" | "naming" | "saving">("idle");

  const {
    projects,
    loading: projectsLoading,
    saving,
    error: cloudError,
    saveProject,
    loadProject,
    deleteProject,
  } = useCloudStorage();

  /* ── Resizable drag bar ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPos, setSplitPos] = useState(55);
  const isDragging = useRef(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(30, Math.min(75, pos)));
    };
    const onUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setDragActive(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* ── Header scroll detection ── */
  useEffect(() => {
    const scrollEl = document.querySelector(".chat-scroll");
    if (!scrollEl) return;
    const onScroll = () => setHeaderScrolled(scrollEl.scrollTop > 40);
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const startDrag = () => {
    isDragging.current = true;
    setDragActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  /* ── Pop-out mode ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") {
      const ds = params.get("ds") as DesignSystem | null;
      const m = params.get("mode") as BuilderMode | null;
      const t = params.get("type") as InterfaceType | null;
      const c = params.get("components");
      if (ds) setDesignSystem(ds);
      if (m) setMode(m);
      if (t) setInterfaceType(t);
      if (c) setSelectedComponents(c.split(","));
      setIsStandalone(true);
    }
  }, [setDesignSystem, setMode, setInterfaceType, setSelectedComponents]);

  /* ── Quick-save from top bar ── */
  const handleQuickSave = async () => {
    const now = new Date();
    const defaultName = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    const name = window.prompt("Save project as:", defaultName);
    if (name === null) return; // user cancelled
    try {
      await saveProject(name.trim() || defaultName);
    } catch {
      // error surfaced by hook
    }
  };

  const handleSaveProject = async () => {
    const name = saveNameInput.trim() || `Project ${new Date().toLocaleDateString()}`;
    setSaveStep("saving");
    try {
      await saveProject(name);
      setSaveStep("idle");
      setSaveNameInput("");
    } catch {
      setSaveStep("idle");
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    loadProject(project);
    setProjectsOpen(false);
  };

  const handleDownload = () => {
    setDownloading(true);
    const config = {
      designSystem, mode, density, interfaceType,
      selectedComponents, colorOverrides,
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

  if (isStandalone) return <StandalonePreview />;

  return (
    <div className={`builder-shell ${mode === "light" ? "builder-light" : ""}`}>

      {/* Liquid gradient background */}
      <div className="liquid-bg" aria-hidden="true">
        <WaveScene />
      </div>

      {/* ── Gemini sidebar ── */}
      <GeminiSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        projects={projects}
        loading={projectsLoading}
        onProjectLoad={handleLoadProject}
        onProjectsOpen={() => { setProjectsOpen(true); setSaveStep("idle"); }}
      />

      {/* ── Main content area ── */}
      <div className="main-content">

        {/* ── Top bar ── */}
        <div className={`top-bar ${headerScrolled ? "scrolled" : ""}`}>

          {/* Left: hamburger (hidden when open, keeps space) + logo */}
          <div className="top-bar-left">
            <button
              className={`top-bar-btn icon-only sidebar-toggle-btn ${isSidebarOpen ? "sb-hidden" : ""}`}
              onClick={() => setIsSidebarOpen((v) => !v)}
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
            </button>
            <div className="top-bar-logo">
              <img
                src="/aologo.svg"
                alt="ausōs"
                className="ausos-logo-img"
              />
            </div>
          </div>

          {/* Right: all existing controls unchanged */}
          <div className="top-bar-right">
            {/* Preview-specific actions */}
            {previewOpen && (
              <div className="top-bar-actions">
                <span className="preview-badge-inline">
                  {designSystem.toUpperCase()} &middot; {mode}
                </span>
                <span className="preview-badge-inline">
                  {interfaceType} &middot; {selectedComponents.length} components
                </span>
                <button
                  className="preview-action-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                  title="Download config"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {downloading ? "hourglass_top" : "download"}
                  </span>
                </button>
              </div>
            )}

            {/* Save */}
            <button
              className="top-bar-save-btn"
              onClick={handleQuickSave}
              disabled={saving}
              title="Save project"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {saving ? "hourglass_top" : "save"}
              </span>
              <span>{saving ? "Saving…" : "Save"}</span>
            </button>

            {/* Dark / Light toggle */}
            <button
              className="top-bar-btn icon-only"
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {mode === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* UI Kit */}
            <Link href="/ui-kit" className="top-bar-btn" title="UI Kit Overview">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>palette</span>
              UI Kit
            </Link>

            {/* Preview toggle */}
            <button
              className={`preview-toggle-btn ${previewOpen ? "active" : ""}`}
              onClick={togglePreview}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
              Preview
            </button>
          </div>
        </div>

        {/* ── Content: chat + resizable preview ── */}
        <div
          className={`content-split ${previewOpen ? "has-preview" : ""} ${!isChatOpen ? "chat-collapsed" : ""}`}
          ref={containerRef}
          style={
            previewOpen && isChatOpen
              ? ({ "--chat-width": `${splitPos}%` } as React.CSSProperties)
              : undefined
          }
        >
          <div className={`chat-slide ${isChatOpen ? "chat-slide-open" : "chat-slide-closed"}`}>
            <ChatPanel />
          </div>

          {previewOpen && isChatOpen && (
            <div
              className={`resize-handle ${dragActive ? "dragging" : ""}`}
              onMouseDown={startDrag}
            />
          )}

          <PreviewSidePanel />
        </div>
      </div>

      <SettingsPanel />

      {/* ── My Projects modal ── */}
      {projectsOpen && (
        <div className="projects-overlay" onClick={() => setProjectsOpen(false)}>
          <div className="projects-modal" onClick={(e) => e.stopPropagation()}>
            <div className="projects-modal-header">
              <span className="projects-modal-title">My Projects</span>
              <button className="projects-modal-close" onClick={() => setProjectsOpen(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <div className="projects-save-row">
              {saveStep === "naming" ? (
                <>
                  <input
                    className="projects-name-input"
                    placeholder="Project name…"
                    value={saveNameInput}
                    onChange={(e) => setSaveNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveProject();
                      if (e.key === "Escape") setSaveStep("idle");
                    }}
                    autoFocus
                  />
                  <button className="projects-save-btn" onClick={handleSaveProject} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button className="projects-cancel-btn" onClick={() => setSaveStep("idle")}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="projects-save-btn wide" onClick={() => setSaveStep("naming")}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                  Save current design
                </button>
              )}
            </div>

            {cloudError && <div className="projects-error">{cloudError}</div>}

            <div className="projects-list">
              {projectsLoading ? (
                <div className="projects-empty">Loading…</div>
              ) : projects.length === 0 ? (
                <div className="projects-empty">No saved projects yet.</div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="project-item">
                    <div className="project-item-info" onClick={() => handleLoadProject(p)}>
                      <span className="project-item-name">{p.name}</span>
                      <span className="project-item-date">
                        {p.updatedAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <button
                      className="project-item-delete"
                      onClick={() => deleteProject(p.id)}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        delete
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Page-level copyright ── */}
      <div className="builder-copyright-fixed" aria-hidden="true">
        &copy; {new Date().getFullYear()} ausōs. All rights reserved.
      </div>
    </div>
  );
}
