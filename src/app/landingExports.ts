/**
 * Landing: real export output.
 *
 * Excerpts of the files the builder's exporters wrote for the Analytics
 * Dashboard screen in Salt DS, dark mode (captured 2026-10-04 from the
 * Export Code dialog). Verbatim: nothing edited, only cut to a line range.
 */
export interface ExportSample {
  id: string;
  /** The format name as the Export Code dialog shows it. */
  format: string;
  file: string;
  /** The first line shown, how many lines, and how long the real file is. */
  from: number;
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
    from: 1,
    shown: 20,
    total: 128,
    note: "A component and its stylesheet. It imports the design system's own packages, so the screen renders with the real components.",
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
    id: "html",
    format: "HTML",
    file: "dashboard.html",
    from: 1,
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
] as const;
