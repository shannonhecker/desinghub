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
    <div style={{ background: "#16213e", borderRadius: 8, border: "1px solid #2a2a4a", padding: 16, marginTop: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Contrast Audit — {T.name || "Current Theme"}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: "6px 12px", fontSize: 12 }}>
        <div style={{ color: "#707080", fontWeight: 600 }}>Foreground</div>
        <div style={{ color: "#707080", fontWeight: 600 }}>Background</div>
        <div style={{ color: "#707080", fontWeight: 600 }}>Ratio</div>
        <div style={{ color: "#707080", fontWeight: 600 }}>AA</div>
        <div style={{ color: "#707080", fontWeight: 600 }}>Preview</div>
        {pairs.map((p) => {
          if (!isHex(p.fgVal) || !isHex(p.bgVal)) return null;
          const ratio = contrastRatio(p.fgVal, p.bgVal);
          const passes = meetsAA(ratio);
          return (
            <React.Fragment key={`${p.fg}-${p.bg}`}>
              <div style={{ color: "#e0e0e0" }}>{p.fg} <span style={{ color: "#707080", fontFamily: "monospace", fontSize: 10 }}>{p.fgVal}</span></div>
              <div style={{ color: "#e0e0e0" }}>{p.bg} <span style={{ color: "#707080", fontFamily: "monospace", fontSize: 10 }}>{p.bgVal}</span></div>
              <div style={{ fontFamily: "monospace", color: passes ? "#53B087" : "#FF5D57" }}>{formatRatio(ratio)}</div>
              <div style={{ color: passes ? "#53B087" : "#FF5D57", fontWeight: 600 }}>{passes ? "PASS" : "FAIL"}</div>
              <div style={{ width: 60, height: 24, background: p.bgVal, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: p.fgVal, fontSize: 11, fontWeight: 600, border: "1px solid #2a2a4a" }}>Aa</div>
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
    : getTheme("fluent", store.fluent.themeKey);

  const issues = useMemo(() => (code ? runAudit(code, activeSystem, T) : []), [code, activeSystem, T]);

  const critical = issues.filter((i) => i.severity === "critical");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Design Audit</h2>
      <p style={{ fontSize: 13, color: "#707080", marginBottom: 16 }}>
        Paste your {sysInfo.name} code below. The audit checks for raw hex values, wrong component APIs,
        contrast ratios, accessibility, and dark mode compliance.
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={`Paste your ${sysInfo.name} React/JSX code here...`}
        style={{
          width: "100%", height: 200, background: "#0d1117", color: "#e6edf3",
          border: "1px solid #2a2a4a", borderRadius: 8, padding: 16, fontSize: 13,
          fontFamily: "'SF Mono', 'Fira Code', monospace", lineHeight: 1.6,
          resize: "vertical", outline: "none",
        }}
      />

      {code && (
        <div style={{ marginTop: 16 }}>
          {/* Score */}
          <div style={{
            display: "flex", gap: 16, padding: 16, background: "#16213e",
            borderRadius: 8, border: "1px solid #2a2a4a", marginBottom: 16,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: critical.length === 0 ? "#53B087" : "#FF5D57" }}>
                {issues.length === 0 ? "A+" : critical.length > 3 ? "F" : critical.length > 0 ? "C" : "B+"}
              </div>
              <div style={{ fontSize: 11, color: "#707080" }}>Score</div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#FF5D57" }}>{critical.length}</div>
                <div style={{ fontSize: 11, color: "#707080" }}>Critical</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#F59E0B" }}>{warnings.length}</div>
                <div style={{ fontSize: 11, color: "#707080" }}>Warnings</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#4fc3f7" }}>{infos.length}</div>
                <div style={{ fontSize: 11, color: "#707080" }}>Info</div>
              </div>
            </div>
          </div>

          {/* Issues */}
          {issues.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#53B087", fontSize: 14, fontWeight: 600 }}>
              No issues found. Code passes all design checks.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {issues.map((issue, i) => (
                <div key={i} style={{
                  padding: 12, borderRadius: 6,
                  background: issue.severity === "critical" ? "#FF5D5708" : issue.severity === "warning" ? "#F59E0B08" : "#4fc3f708",
                  border: `1px solid ${issue.severity === "critical" ? "#FF5D5730" : issue.severity === "warning" ? "#F59E0B30" : "#4fc3f730"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase", padding: "1px 6px", borderRadius: 4,
                      background: issue.severity === "critical" ? "#FF5D5720" : issue.severity === "warning" ? "#F59E0B20" : "#4fc3f720",
                      color: issue.severity === "critical" ? "#FF5D57" : issue.severity === "warning" ? "#F59E0B" : "#4fc3f7",
                    }}>
                      {issue.severity}
                    </span>
                    <span style={{ fontSize: 10, color: "#707080" }}>{issue.category}</span>
                    {issue.line && <span style={{ fontSize: 10, color: "#707080" }}>Line {issue.line}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#e0e0e0" }}>{issue.message}</div>
                  {issue.fix && (
                    <div style={{ fontSize: 11, color: "#4fc3f7", marginTop: 4 }}>Fix: {issue.fix}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contrast Audit */}
      <ContrastAudit system={activeSystem} T={T} />
    </div>
  );
}
