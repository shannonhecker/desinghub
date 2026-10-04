/**
 * Landing: real export output.
 *
 * The opening lines of each file the builder's exporters wrote for the
 * Analytics Home report in Salt DS, dark mode (captured 2026-10-04 from the
 * Export Code dialog). Verbatim: nothing edited, only cut short.
 */
export interface ExportSample {
  id: string;
  /** The format name as the Export Code dialog shows it. */
  format: string;
  file: string;
  /** How many lines of the real file are shown, and how long the file is. */
  shown: number;
  total: number;
  note: string;
  source: string;
}

export const EXPORT_SAMPLES: readonly ExportSample[] = [
  {
    id: "tsx",
    format: "React (TSX)",
    file: "dashboard.tsx",
    shown: 20,
    total: 128,
    note: "A component and its stylesheet. It imports the design system's own packages, so the report renders with the real components.",
    source: `import React from "react";
import "./styles.css";
import { Dropdown, FormField, FormFieldLabel, NavigationItem, Option } from "@salt-ds/core";
import { GridItem, GridLayout, StackLayout } from "@salt-ds/core";
import { SaltProvider } from "@salt-ds/core";
import "@salt-ds/theme/index.css";

export default function Dashboard() {
  return (
    <SaltProvider mode="dark" density="medium">
    <div className="dashboard-layout" data-mode="dark" data-density="medium">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* Header */}
      <header className="zone-header" data-layout="ds" data-tone="dark" data-flush="true">
        <StackLayout gap={0}><div className="topnav" data-tone="dark">
  <div className="topnav-brand">
    <span className="topnav-mark" aria-hidden="true">M</span>
    <span className="topnav-name">Meridian Analytics</span>
  </div>
  <span className="topnav-divider" aria-hidden="true"></span>`,
  },
  {
    id: "sh",
    format: "Vite project",
    file: "design-hub-project.sh",
    shown: 22,
    total: 743,
    note: "One script. Run it in an empty folder and it writes a React and TypeScript project, installs it and starts the dev server.",
    source: `#!/bin/sh
# ─────────────────────────────────────────────────────────────────────
# Design Hub - Vite project bootstrap
# Generated: 2026-10-04T20:10:26.428Z
# Design system: salt
# Mode: dark
# Total blocks: 16
# ─────────────────────────────────────────────────────────────────────
# Run this script in an empty directory:
#   sh design-hub-project.sh
# It will create a folder "design-hub-app/", populate it, and install deps.
# ─────────────────────────────────────────────────────────────────────
set -e

PROJECT_DIR="design-hub-app"
if [ -d "$PROJECT_DIR" ]; then
  echo "Directory '$PROJECT_DIR' already exists. Remove it first or cd into a different folder."
  exit 1
fi

mkdir -p "$PROJECT_DIR/src"
cd "$PROJECT_DIR"`,
  },
  {
    id: "html",
    format: "HTML",
    file: "dashboard.html",
    shown: 9,
    total: 545,
    note: "A single page you can open in a browser, with its styles inline.",
    source: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - SALT</title>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; }`,
  },
  {
    id: "json",
    format: "Tokens (JSON)",
    file: "tokens.json",
    shown: 20,
    total: 127,
    note: "The active system's tokens in W3C Design Tokens format, each with its CSS variable.",
    source: `{
  "$description": "Salt DS design tokens (dark) exported from Design Hub",
  "$extensions": {
    "com.designhub": {
      "system": "salt",
      "mode": "dark",
      "themeKey": "jpm-dark",
      "source": "official",
      "generatedAt": "2026-10-04T20:10:28.870Z",
      "note": "Curated Salt characteristic tokens (the full set ships in @salt-ds/theme)."
    }
  },
  "salt": {
    "container-primary-background": {
      "$type": "color",
      "$value": "rgb(36,37,38)",
      "$extensions": {
        "com.designhub.cssVar": "--salt-container-primary-background"
      }
    },`,
  },
] as const;
