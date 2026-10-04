"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getSystemInfo } from "@/data/registry";
import { KIT_SYSTEMS, builderHrefFor, isDarkActive, toggleActiveMode } from "./kitHandoff";
import "./tool-page.css";

const TOOLS = [
  { href: "/token-editor", label: "Token reference" },
  { href: "/theme-builder", label: "Theme builder" },
];

/**
 * Shell for the standalone library tools (/token-editor, /theme-builder).
 *
 * The app locks html/body scrolling for the canvas, so a tool page needs its
 * own scrolling surface, and it has to paint that surface from the active
 * system's tokens: without it the tool rendered dark-theme text straight onto
 * the white document. Every colour here is a token of the system in view,
 * passed down as --tool-* custom properties for tool-page.css.
 */
export function ToolPageShell({ children }: { children: ReactNode }) {
  const t = useTheme();
  const pathname = usePathname();
  const state = useDesignHub();
  const system = state.activeSystem;
  const dark = isDarkActive(state);
  const nextMode = dark ? "light" : "dark";
  /* uoaui tokens are translucent glass layers that only read over its
     aurora wash, so that system paints the wash over an opaque fallback. */
  const wash = system === "uoaui" && t.T.gradient ? (t.T.gradient as string) : undefined;
  /* Carbon is square; Material is rounder; the rest take the small curve. */
  const radius = system === "carbon" ? "0px" : system === "m3" ? "12px" : "6px";

  return (
    <div
      className="tool-page"
      data-system={system}
      data-mode={dark ? "dark" : "light"}
      style={{
        backgroundColor: t.bg,
        backgroundImage: wash,
        color: t.fg,
        colorScheme: dark ? "dark" : "light",
        "--tool-bg": t.bg,
        "--tool-surface": system === "uoaui" ? (t.T.cardBg as string) || t.bg2 : t.bg2,
        "--tool-fg": t.fg,
        "--tool-muted": t.fg2,
        "--tool-border": t.border,
        "--tool-border-subtle": t.borderSubtle,
        "--tool-accent": t.accent,
        "--tool-accent-fg": t.accentFg,
        "--tool-accent-text": t.accentText,
        "--tool-accent-weak": t.accentWeak,
        "--tool-focus": t.focusRing,
        "--tool-danger": t.dangerFg ?? t.fg,
        "--tool-font": t.font,
        "--tool-radius": radius,
      } as CSSProperties}
    >
      <header className="tool-bar">
        <Link href="/ui-kit" className="tool-brand" aria-label="Back to the UI kit">
          <img src="/aologo.svg" alt="" aria-hidden="true" style={{ filter: dark ? "brightness(0) invert(1)" : "brightness(0)" }} />
          <span>UI kit</span>
        </Link>
        <nav className="tool-tabs" aria-label="Library tools">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} aria-current={pathname === tool.href ? "page" : undefined}>
              {tool.label}
            </Link>
          ))}
        </nav>
        <div className="tool-settings">
          {/* Phones get the native picker; five names do not fit one row. */}
          <label className="tool-system-select">
            <span className="sr-only">Design system</span>
            <select value={system} onChange={(e) => state.setActiveSystem(e.target.value as SystemId)}>
              {KIT_SYSTEMS.map((id) => <option key={id} value={id}>{getSystemInfo(id).name}</option>)}
            </select>
          </label>
          <div className="tool-systems" role="group" aria-label="Design system">
            {KIT_SYSTEMS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={system === id}
                onClick={() => state.setActiveSystem(id)}
              >
                {getSystemInfo(id).name}
              </button>
            ))}
          </div>
          <button type="button" className="tool-ghost" onClick={toggleActiveMode} aria-label={`Switch to ${nextMode} mode`}>
            <span className="material-symbols-outlined" aria-hidden="true">{dark ? "light_mode" : "dark_mode"}</span>
            <span>{dark ? "Light" : "Dark"}</span>
          </button>
          <Link href={builderHrefFor(state)} className="tool-ghost" data-testid="tool-builder-link">
            <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
            <span>Open Builder</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
