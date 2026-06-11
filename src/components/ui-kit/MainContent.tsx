"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents } from "@/data/registry";
import { ComponentPreview, getDetailSections } from "@/components/ComponentPreview";
import { TokenReference } from "@/components/TokenReference";
import { AuditPanel } from "@/components/AuditPanel";
import { useActiveTheme } from "@/components/DesignHubApp";
import { InPageTOC } from "./InPageTOC";
import { LandingGrid } from "./LandingGrid";
import { FoundationPage } from "./FoundationPage";
import { COMPONENT_ROUTES, getUiKitGroup } from "./uiKitGroups";

/* Lazy-load the builder-vocabulary gallery: it pulls in the builder's
   ComponentRenderer (SimulatedUI + Highcharts), so deferring it keeps the
   /ui-kit initial bundle lean. Only loads when "Builder Blocks" is opened. */
const BuilderBlockGallery = dynamic(
  () => import("./BuilderBlockGallery").then((m) => m.BuilderBlockGallery),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 48, fontSize: 14, opacity: 0.6 }}>Loading builder blocks…</div>
    ),
  },
);

/**
 * DetailLayout — wraps a component-detail ComponentPreview in the premium
 * 2-column shell: scrollable content + a sticky right-rail in-page TOC
 * (m3.material.io anatomy pattern, owner-locked). The TOC is only shown when the
 * component actually renders the multi-section detail page (Salt / M3 / Fluent /
 * uoaui core components produce 2+ sections); Carbon and tool pages return no
 * sections, in which case the preview renders full-width with no rail.
 */
function DetailLayout({ componentId }: { componentId: string }) {
  const t = useActiveTheme();
  const sections = getDetailSections(t.activeSystem, componentId);
  const showToc = sections.length > 1;

  if (!showToc) return <ComponentPreview componentId={componentId} />;

  return (
    <div className="dh-detail-layout">
      <div className="dh-detail-main">
        <ComponentPreview componentId={componentId} />
      </div>
      <aside className="dh-detail-rail">
        <InPageTOC sections={sections} t={t} />
      </aside>
    </div>
  );
}

export function MainContent() {
  const selectedComponent = useDesignHub((s) => s.selectedComponent);
  const activeSystem = useDesignHub((s) => s.activeSystem);

  if (!selectedComponent) return <LandingGrid />;

  /* Special ids route via the single COMPONENT_ROUTES table (shared with
     ComponentList + LandingGrid) so nav, overview, and content can't drift. */
  const route = COMPONENT_ROUTES[selectedComponent];
  if (route) {
    switch (route.kind) {
      case "token-reference": return <TokenReference />;
      case "audit-panel": return <AuditPanel />;
      case "builder-blocks": return <BuilderBlockGallery />;
      case "preview": return <DetailLayout componentId={route.componentId} />;
    }
  }

  const components = getComponents(activeSystem);
  const entry = components.find(c => c.id === selectedComponent);
  if (!entry) return <LandingGrid />;

  /* Foundations (discriminated by CATEGORY via getUiKitGroup, not id —
     Salt/Carbon/uoaui/fluent use dl-* ids, M3 uses a11y / guide-* /
     *-tokens) are self-contained reference documents with no metaId, so
     the component shell would only wrap them in empty Variants / Props /
     Guidance filler. Route them to the doc-style template instead. The
     Tools ids (tokens / audit / builder-blocks) never reach here — they
     resolve via COMPONENT_ROUTES above. */
  if (getUiKitGroup(entry.id, entry.cat) === "Foundations") {
    return <FoundationPage componentId={selectedComponent} />;
  }

  return <DetailLayout componentId={selectedComponent} />;
}
