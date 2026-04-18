"use client";

import React, { useState, useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getTheme, getSystemInfo } from "@/data/registry";
import { contrastRatio, formatRatio, meetsAA, isHex } from "@/lib/contrastUtils";

interface AuditIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  line?: number;
  fix?: string;
}

function runAudit(code: string, system: string, T: any): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const lines = code.split("\n");

  // 1. Raw hex detection
  lines.forEach((line, i) => {
    const hexMatches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexMatches) {
      hexMatches.forEach((hex) => {
        // Skip if inside a comment
        if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;
        issues.push({
          severity: "critical",
          category: "Token Usage",
          message: `Raw hex value "${hex}" found. Use a semantic token instead.`,
          line: i + 1,
          fix: system === "salt"
            ? `Replace with var(--salt-palette-...) or var(--salt-color-...)`
            : system === "m3"
            ? `Replace with theme token (e.g., theme.palette.primary.main)`
            : `Replace with Fluent token (e.g., tokens.colorBrandBackground)`,
        });
      });
    }
  });

  // 2. Component API audit
  if (system === "salt") {
    // Check for wrong appearances
    const wrongAppearances = [
      { wrong: /appearance=["']filled["']/gi, fix: 'Use appearance="solid" (Salt uses solid, not filled)' },
      { wrong: /appearance=["']outlined["']/gi, fix: 'Use appearance="bordered" (Salt uses bordered, not outlined)' },
      { wrong: /appearance=["']text["']/gi, fix: 'Use appearance="transparent" (Salt uses transparent, not text)' },
      { wrong: /variant=["'](contained|outlined|text)["']/gi, fix: "Salt uses appearance prop, not variant" },
    ];
    wrongAppearances.forEach(({ wrong, fix }) => {
      lines.forEach((line, i) => {
        if (wrong.test(line)) {
          issues.push({ severity: "critical", category: "Component API", message: `Wrong prop detected`, line: i + 1, fix });
          wrong.lastIndex = 0;
        }
      });
    });
  } else if (system === "m3") {
    const wrongProps = [
      { wrong: /appearance=["'](solid|bordered|transparent)["']/gi, fix: "M3 uses variant prop: filled, outlined, text, elevated, tonal" },
      { wrong: /sentiment=["']\w+["']/gi, fix: "M3 uses color prop (primary, secondary, error), not sentiment" },
    ];
    wrongProps.forEach(({ wrong, fix }) => {
      lines.forEach((line, i) => {
        if (wrong.test(line)) {
          issues.push({ severity: "critical", category: "Component API", message: `Wrong prop for M3`, line: i + 1, fix });
          wrong.lastIndex = 0;
        }
      });
    });
  } else {
    const wrongProps = [
      { wrong: /variant=["'](contained|filled)["']/gi, fix: 'Fluent uses appearance: "primary", "secondary", "outline", "subtle", "transparent"' },
      { wrong: /sentiment=["']\w+["']/gi, fix: "Fluent doesn't use sentiment prop" },
    ];
    wrongProps.forEach(({ wrong, fix }) => {
      lines.forEach((line, i) => {
        if (wrong.test(line)) {
          issues.push({ severity: "critical", category: "Component API", message: `Wrong prop for Fluent`, line: i + 1, fix });
          wrong.lastIndex = 0;
        }
      });
    });
  }

  // 3. Inline styles check
  lines.forEach((line, i) => {
    if (/style=\{\{/.test(line)) {
      // Check for raw px values in inline styles
      const pxMatches = line.match(/:\s*["']?\d+px["']?/g);
      if (pxMatches) {
        issues.push({
          severity: "warning",
          category: "Token Usage",
          message: "Raw px values in inline styles. Consider using spacing tokens.",
          line: i + 1,
          fix: system === "salt"
            ? "Use var(--salt-spacing-100), var(--salt-spacing-200), etc."
            : system === "m3"
            ? "Use theme.spacing(1), theme.spacing(2), etc."
            : "Use tokens.spacingHorizontalM, etc.",
        });
      }
    }
  });

  // 4. Accessibility checks
  const hasAriaLabel = /aria-label/i.test(code);
  const hasRole = /role=/i.test(code);
  const iconButtons = code.match(/<IconButton|<button.*icon/gi);
  if (iconButtons && !hasAriaLabel) {
    issues.push({
      severity: "warning",
      category: "Accessibility",
      message: "Icon buttons found without aria-label attributes.",
      fix: 'Add aria-label="descriptive text" to all icon-only buttons',
    });
  }

  // 5. Missing validation states
  const hasInput = /<Input|<TextField|<input/i.test(code);
  const hasValidation = /validationStatus|validationState|error|helperText/i.test(code);
  if (hasInput && !hasValidation) {
    issues.push({
      severity: "info",
      category: "Validation",
      message: "Form inputs found without validation state handling.",
      fix: "Add error, warning, and success validation states to all inputs",
    });
  }

  // 6. Dark mode check
  if (/color:\s*["']?(black|white|#000|#fff)["']?/i.test(code)) {
    issues.push({
      severity: "warning",
      category: "Dark Mode",
      message: "Hardcoded black/white colors won't work in dark mode.",
      fix: "Use semantic foreground/background tokens that switch with theme",
    });
  }

  return issues;
}

function ContrastAudit({ system, T }: { system: string; T: any }) {
  // Derive card colours from the active DS tokens so the card feels native
  const cardBg  = system === "salt" ? T.bg : system === "m3" ? (T.surfaceContainer ?? T.surface) : system === "ausos" ? T.surface : T.bg2;
  const cardBdr = system === "salt" ? T.border : system === "m3" ? T.outlineVariant : system === "ausos" ? T.borderMd : T.stroke2;
  const titleFg = system === "salt" ? T.fg : system === "m3" ? T.onSurface : system === "ausos" ? T.fg : T.fg1;
  const labelFg = system === "salt" ? T.fg2 : system === "m3" ? T.onSurfaceVariant : system === "ausos" ? T.fg2 : T.fg2;
  const rowFg   = system === "salt" ? T.fg : system === "m3" ? T.onSurface : system === "ausos" ? T.fg : T.fg1;
  const monoFg  = system === "salt" ? T.fg3 : system === "m3" ? T.onSurfaceVariant : system === "ausos" ? T.fg3 : T.fg3;

  const pairs = useMemo(() => {
    if (system === "salt") {
      return [
        { fg: "fg", bg: "bg", fgVal: T.fg, bgVal: T.bg },
        { fg: "fg2", bg: "bg", fgVal: T.fg2, bgVal: T.bg },
        { fg: "fg3", bg: "bg", fgVal: T.fg3, bgVal: T.bg },
        { fg: "accent", bg: "bg", fgVal: T.accent, bgVal: T.bg },
        { fg: "accentText", bg: "bg", fgVal: T.accentText, bgVal: T.bg },
        { fg: "accentFg", bg: "accent", fgVal: T.accentFg, bgVal: T.accent },
        { fg: "positive", bg: "bg", fgVal: T.positive, bgVal: T.bg },
        { fg: "negative", bg: "bg", fgVal: T.negative, bgVal: T.bg },
      ];
    }
    if (system === "m3") {
      return [
        { fg: "onSurface", bg: "surface", fgVal: T.onSurface, bgVal: T.surface },
        { fg: "onSurfaceVariant", bg: "surface", fgVal: T.onSurfaceVariant, bgVal: T.surface },
        { fg: "primary", bg: "surface", fgVal: T.primary, bgVal: T.surface },
        { fg: "onPrimary", bg: "primary", fgVal: T.onPrimary, bgVal: T.primary },
        { fg: "onError", bg: "error", fgVal: T.onError, bgVal: T.error },
        { fg: "outline", bg: "surface", fgVal: T.outline, bgVal: T.surface },
      ];
    }
    if (system === "ausos") {
      return [
        { fg: "fg", bg: "bg", fgVal: T.fg, bgVal: T.bg },
        { fg: "fg2", bg: "bg", fgVal: T.fg2, bgVal: T.bg },
        { fg: "fg3", bg: "bg", fgVal: T.fg3, bgVal: T.bg },
        { fg: "accent", bg: "bg", fgVal: T.accent, bgVal: T.bg },
        { fg: "accentFg", bg: "accent", fgVal: T.accentFg, bgVal: T.accent },
        { fg: "borderStrong", bg: "bg", fgVal: T.borderStrong, bgVal: T.bg },
        { fg: "successFg", bg: "bg", fgVal: T.successFg, bgVal: T.bg },
        { fg: "dangerFg", bg: "bg", fgVal: T.dangerFg, bgVal: T.bg },
        { fg: "warningFg", bg: "bg", fgVal: T.warningFg, bgVal: T.bg },
      ];
    }
    return [
      { fg: "fg1", bg: "bg1", fgVal: T.fg1, bgVal: T.bg1 },
      { fg: "fg2", bg: "bg1", fgVal: T.fg2, bgVal: T.bg1 },
      { fg: "fg3", bg: "bg1", fgVal: T.fg3, bgVal: T.bg1 },
      { fg: "brandFg1", bg: "bg1", fgVal: T.brandFg1, bgVal: T.bg1 },
      { fg: "fgOnBrand", bg: "brandBg", fgVal: T.fgOnBrand, bgVal: T.brandBg },
      { fg: "dangerFg1", bg: "bg1", fgVal: T.dangerFg1, bgVal: T.bg1 },
    ];
  }, [system, T]);

  return (
    <div style={{ background: cardBg, borderRadius: 8, border: `1px solid ${cardBdr}`, padding: 16, marginTop: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: titleFg, marginBottom: 12 }}>Contrast Audit - {T.name || "Current Theme"}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: "6px 12px", fontSize: 12 }}>
        <div style={{ color: labelFg, fontWeight: 600 }}>Foreground</div>
        <div style={{ color: labelFg, fontWeight: 600 }}>Background</div>
        <div style={{ color: labelFg, fontWeight: 600 }}>Ratio</div>
        <div style={{ color: labelFg, fontWeight: 600 }}>AA</div>
        <div style={{ color: labelFg, fontWeight: 600 }}>Preview</div>
        {pairs.map((p) => {
          if (!isHex(p.fgVal) || !isHex(p.bgVal)) return null;
          const ratio = contrastRatio(p.fgVal, p.bgVal);
          const passes = meetsAA(ratio);
          return (
            <React.Fragment key={`${p.fg}-${p.bg}`}>
              <div style={{ color: rowFg }}>{p.fg} <span style={{ color: monoFg, fontFamily: "monospace", fontSize: 10 }}>{p.fgVal}</span></div>
              <div style={{ color: rowFg }}>{p.bg} <span style={{ color: monoFg, fontFamily: "monospace", fontSize: 10 }}>{p.bgVal}</span></div>
              <div style={{ fontFamily: "monospace", color: passes ? (system === "salt" ? (T.positive || "#36b37e") : system === "m3" ? (T.tertiary || "#36b37e") : (T.successFg1 || "#107C10")) : (system === "salt" ? (T.negative || "#de350b") : system === "m3" ? (T.error || "#B3261E") : (T.dangerFg1 || "#D13438")) }}>{formatRatio(ratio)}</div>
              <div style={{ color: passes ? (system === "salt" ? (T.positive || "#36b37e") : system === "m3" ? (T.tertiary || "#36b37e") : (T.successFg1 || "#107C10")) : (system === "salt" ? (T.negative || "#de350b") : system === "m3" ? (T.error || "#B3261E") : (T.dangerFg1 || "#D13438")), fontWeight: 600 }}>{passes ? "PASS" : "FAIL"}</div>
              <div style={{ width: 60, height: 24, background: p.bgVal, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: p.fgVal, fontSize: 11, fontWeight: 600, border: `1px solid ${cardBdr}` }}>Aa</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function AuditPanel() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const sysInfo = getSystemInfo(activeSystem);
  const [code, setCode] = useState("");

  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : activeSystem === "ausos"
    ? getTheme("ausos", store.ausos.themeKey)
    : getTheme("fluent", store.fluent.themeKey);

  // Derive semantic colors from active DS tokens
  const pageBg  = activeSystem === "salt" ? T.bg2  : activeSystem === "m3" ? T.surface            : T.bg2;
  const cardBg  = activeSystem === "salt" ? T.bg3  : activeSystem === "m3" ? (T.surfaceContainer ?? T.surface) : T.bg3;
  const fg      = activeSystem === "salt" ? T.fg   : activeSystem === "m3" ? T.onSurface           : T.fg1;
  const fg2     = activeSystem === "salt" ? T.fg2  : activeSystem === "m3" ? T.onSurfaceVariant    : T.fg2;
  const fg3     = activeSystem === "salt" ? T.fg3  : activeSystem === "m3" ? T.outline             : T.fg3;
  const border  = activeSystem === "salt" ? T.border : activeSystem === "m3" ? T.outlineVariant    : T.stroke2;
  const accent  = activeSystem === "salt" ? T.accent : activeSystem === "m3" ? T.primary           : T.brandBg;
  const positive = activeSystem === "salt" ? (T.positive || "#36b37e") : activeSystem === "m3" ? (T.tertiary || "#36b37e") : (T.successFg1 || "#107C10");
  const negative = activeSystem === "salt" ? (T.negative || "#de350b") : activeSystem === "m3" ? (T.error || "#B3261E")    : (T.dangerFg1 || "#D13438");
  const warning  = activeSystem === "salt" ? (T.caution || "#ffab00")  : activeSystem === "m3" ? (T.tertiary || "#7D5260") : (T.warningFg1 || "#C19C00");

  const issues = useMemo(() => (code ? runAudit(code, activeSystem, T) : []), [code, activeSystem, T]);

  const critical = issues.filter((i) => i.severity === "critical");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <div style={{ padding: 24, background: pageBg, minHeight: "100%" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: fg, marginBottom: 4 }}>Design Audit</h2>
      <p style={{ fontSize: 13, color: fg2, marginBottom: 16 }}>
        Paste your {sysInfo.name} code below. The audit checks for raw hex values, wrong component APIs,
        contrast ratios, accessibility, and dark mode compliance.
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={`Paste your ${sysInfo.name} React/JSX code here...`}
        style={{
          width: "100%", height: 200, background: cardBg, color: fg,
          border: `1px solid ${border}`, borderRadius: 8, padding: 16, fontSize: 13,
          fontFamily: "'SF Mono', 'Fira Code', monospace", lineHeight: 1.6,
          resize: "vertical", outline: "none",
        }}
      />

      {code && (
        <div style={{ marginTop: 16 }}>
          {/* Score */}
          <div style={{
            display: "flex", gap: 16, padding: 16, background: cardBg,
            borderRadius: 8, border: `1px solid ${border}`, marginBottom: 16,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: critical.length === 0 ? positive : negative }}>
                {issues.length === 0 ? "A+" : critical.length > 3 ? "F" : critical.length > 0 ? "C" : "B+"}
              </div>
              <div style={{ fontSize: 11, color: fg3 }}>Score</div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: negative }}>{critical.length}</div>
                <div style={{ fontSize: 11, color: fg3 }}>Critical</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: warning }}>{warnings.length}</div>
                <div style={{ fontSize: 11, color: fg3 }}>Warnings</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{infos.length}</div>
                <div style={{ fontSize: 11, color: fg3 }}>Info</div>
              </div>
            </div>
          </div>

          {/* Issues */}
          {issues.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: positive, fontSize: 14, fontWeight: 600 }}>
              No issues found. Code passes all design checks.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {issues.map((issue, i) => {
                const sevColor = issue.severity === "critical" ? negative : issue.severity === "warning" ? warning : accent;
                return (
                <div key={i} style={{
                  padding: 12, borderRadius: 6,
                  background: sevColor + "08",
                  border: `1px solid ${sevColor}30`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, padding: "1px 6px", borderRadius: 4,
                      background: sevColor + "20", color: sevColor,
                    }}>
                      {issue.severity}
                    </span>
                    <span style={{ fontSize: 10, color: fg3 }}>{issue.category}</span>
                    {issue.line && <span style={{ fontSize: 10, color: fg3 }}>Line {issue.line}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: fg }}>{issue.message}</div>
                  {issue.fix && (
                    <div style={{ fontSize: 11, color: accent, marginTop: 4 }}>Fix: {issue.fix}</div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contrast Audit */}
      <ContrastAudit system={activeSystem} T={T} />
    </div>
  );
}
