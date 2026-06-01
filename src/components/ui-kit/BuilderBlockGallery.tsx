"use client";

/**
 * BuilderBlockGallery — proves /ui-kit IS the builder's vocabulary.
 *
 * Each card renders a live demo through the BUILDER's own `ComponentRenderer`
 * (with `blockId={undefined}`, so it's a static, store-free render from the
 * block's defaults — no builder store, no DnD, no selection) and shows the
 * EXACT per-DS handoff code the builder export emits via `kitExportCode`
 * (which reuses blockToRealJsx + collectImports verbatim).
 *
 * Theming: ComponentRenderer reads `--ds-*` vars that are defined ONLY by the
 * `.preview-<ds>` rules in builder.css (loaded globally via globals.css). We
 * wrap the gallery and each demo in `preview-<ds>`, inject the DS's source CSS
 * (`--salt-*` / `--cds-*` / class prefixes) from getFullCSS, and add the
 * Carbon `cds--<themeKey>` ancestor + a `builder-light` ancestor for light
 * themes — so the demos are pixel-identical to the builder.
 */

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getFullCSS } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { getPreviewOfficialScope } from "@/lib/officialTokens";
import { ComponentRenderer } from "@/components/builder/ComponentRenderer";
import { RealComponentRenderer, canRenderReal } from "@/components/ui-kit/RealComponentRenderer";
import {
  kitByCategory,
  kitExportCode,
  type KitEntry,
} from "@/lib/kitCatalog";
import type { SystemId } from "@/lib/componentApiRegistry";

/* Salt's provider density is one of these literals; the store stores it as a
   plain string, so coerce to a known value (medium default) for the real
   SaltProvider. Other DSs ignore this. */
type SaltDensity = "high" | "medium" | "low" | "touch";
function coerceSaltDensity(d: unknown): SaltDensity {
  return d === "high" || d === "low" || d === "touch" ? d : "medium";
}

/* Light vs dark is encoded in each DS's themeKey (the `.builder-light
   .preview-*` overrides in builder.css govern light mode). Salt/M3/Fluent/
   uoaui name light themes "*light*"; Carbon's light themes are white/g10. */
function isLightTheme(ds: SystemId, themeKey: string): boolean {
  if (ds === "carbon") return themeKey === "white" || themeKey === "g10";
  return themeKey.toLowerCase().includes("light");
}

export function BuilderBlockGallery() {
  const store = useDesignHub();
  const ds = store.activeSystem;
  const t = useTheme();

  const densityOrSize =
    ds === "salt" ? store.salt.density
    : ds === "m3" ? store.m3.density
    : ds === "carbon" ? store.carbon.density
    : ds === "uoaui" ? store.uoaui.density
    : store.fluent.size;

  const themeKey =
    ds === "salt" ? store.salt.themeKey
    : ds === "m3" ? store.m3.themeKey
    : ds === "carbon" ? store.carbon.themeKey
    : ds === "uoaui" ? store.uoaui.themeKey
    : store.fluent.themeKey;

  /* getFullCSS emits the DS source tokens (--salt-, --cds-, ...) plus the
     per-DS class prefixes (s-/m3-/f-/cb-/a-) that SimulatedUI needs. The
     preview-<ds> class then bridges those source tokens to the --ds- vars
     ComponentRenderer reads. Sanitize before injecting (matches ComponentPreview). */
  const css = getFullCSS(ds, t.T, densityOrSize);
  const light = isLightTheme(ds, themeKey);

  /* Official-token scope wiring (#9 PR-2a): for Salt/Carbon, the wrapper also
     carries the `.salt-theme`[data-mode] / `[data-cds-theme]` scope so the
     OFFICIAL `--salt-*` / `--cds-*` vars (loaded on /ui-kit via the
     @salt-ds/theme import + <OfficialTokenStyles>) resolve here and the
     `.preview-<ds>` bridge reads genuine DS values. No-op for M3/Fluent/uoaui. */
  const officialScope = getPreviewOfficialScope(ds, light ? "light" : "dark", themeKey);

  /* Carbon also needs the cds--<themeKey> ancestor so the @carbon FACSIMILE
     source vars (from getFullCSS) still resolve as a fallback; builder-light
     flips the .preview-* light overrides. */
  const wrapperClass = [
    `preview-${ds}`,
    "preview-canvas-root",
    ds === "carbon" ? `cds--${store.carbon.themeKey}` : "",
    light ? "builder-light" : "",
    officialScope.className,
  ]
    .filter(Boolean)
    .join(" ");

  const groups = kitByCategory();

  return (
    <div
      className={wrapperClass}
      {...officialScope.attrs}
      style={{
        padding: 48,
        fontFamily: t.font,
        color: "var(--ds-fg)",
        background: "var(--ds-bg)",
        minHeight: "100%",
      }}
    >
      {/* DS source tokens + class prefixes the demos need. */}
      <style dangerouslySetInnerHTML={{ __html: sanitizeCSS(css) }} />

      <header style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--ds-primary)",
            marginBottom: 8,
          }}
        >
          One source of truth
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, margin: "0 0 10px" }}>
          Builder Blocks
        </h1>
        <p style={{ fontSize: 15, color: "var(--ds-fg-secondary)", lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
          Every block the builder can drop, rendered live and paired with the
          exact per-design-system code its export emits. The kit and the builder
          share one vocabulary, so this list stays in sync automatically.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.key} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--ds-primary)" }}>
              {group.icon}
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{group.label}</h2>
            <span style={{ fontSize: 13, color: "var(--ds-fg-tertiary)" }}>{group.items.length}</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {group.items.map((entry) => (
              <BlockCard
                key={entry.type}
                entry={entry}
                ds={ds}
                mode={light ? "light" : "dark"}
                saltDensity={coerceSaltDensity(densityOrSize)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Render the REAL official component (Salt/M3/Fluent core set) when eligible,
 * else the builder's Simulated ComponentRenderer (the canvas render path).
 *
 * SSR/hydration safety: providers (MUI emotion, Fluent griffel) only run
 * client-side. We render Simulated until mounted, then swap to the real
 * component for eligible (system, block) pairs — so the first paint matches the
 * server (Simulated everywhere) and there's no hydration mismatch. The whole
 * gallery is also dynamic-imported `ssr: false`, so this is belt-and-suspenders.
 */
function RealOrSimulated({
  entry,
  ds,
  mode,
  saltDensity,
}: {
  entry: KitEntry;
  ds: SystemId;
  mode: "light" | "dark";
  saltDensity: SaltDensity;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && canRenderReal(ds, entry.type)) {
    return (
      <RealComponentRenderer
        system={ds}
        type={entry.type}
        mode={mode}
        saltDensity={saltDensity}
        props={entry.defaults}
      />
    );
  }
  return <ComponentRenderer type={entry.type} system={ds} blockId={undefined} {...entry.defaults} />;
}

function BlockCard({
  entry,
  ds,
  mode,
  saltDensity,
}: {
  entry: KitEntry;
  ds: SystemId;
  mode: "light" | "dark";
  saltDensity: SaltDensity;
}) {
  const { code, imports, isReal } = kitExportCode(ds, entry.type);
  const snippet = isReal
    ? [...imports, "", code].filter((l, i) => !(l === "" && i === imports.length)).join("\n")
    : `// ${entry.label}: no real ${ds} component yet, exports generic markup`;

  /* PR-3: render the REAL official component (Salt/M3/Fluent core set) when
     available; otherwise fall back to the builder's Simulated ComponentRenderer
     (the same render path as the canvas). The provider style engines only run
     client-side (gallery is dynamic-imported ssr:false + RealComponentRenderer
     is mounted-guarded), so until mounted the real renderer returns null and
     the Simulated render shows — no SSR/hydration mismatch. */
  const liveOfficial = canRenderReal(ds, entry.type);

  return (
    <div
      /* The demo card is itself wrapped in preview-<ds> so the --ds-* vars
         resolve for the live ComponentRenderer render. */
      className={`preview-${ds}`}
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: "var(--ds-radius)",
        overflow: "hidden",
        background: "var(--ds-surface)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: 24,
          minHeight: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ds-bg)",
          borderBottom: "1px solid var(--ds-border)",
        }}
      >
        {/* Real official component when available (Salt/M3/Fluent core set),
            else the builder's Simulated render (blockId=undefined → static,
            store-free demo from the block's defaults — same path as canvas). */}
        <div style={{ width: "100%", pointerEvents: "none" }}>
          <RealOrSimulated entry={entry} ds={ds} mode={mode} saltDensity={saltDensity} />
        </div>
      </div>

      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--ds-fg-secondary)" }}>
          {entry.icon}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.label}</span>
        {/* Honest provenance of the LIVE DEMO: a real official React component
            (Salt/M3/Fluent core set), a faithful Simulated preview of a DS that
            has a real export but renders Simulated here, or generic markup. */}
        {liveOfficial ? (
          <span
            title={`Rendered with the official ${ds} React component`}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--ds-primary)",
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ds-primary)" }}
            />
            Live official component
          </span>
        ) : (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--ds-fg-tertiary)",
            }}
          >
            {isReal ? "Faithful preview" : "Generic"}
          </span>
        )}
      </div>

      <pre
        style={{
          margin: 0,
          padding: "12px 14px",
          fontSize: 11,
          lineHeight: 1.5,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          overflowX: "auto",
          background: "color-mix(in srgb, var(--ds-fg) 6%, transparent)",
          color: "var(--ds-fg-secondary)",
          borderTop: "1px solid var(--ds-border)",
        }}
      >
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
