"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents } from "@/data/registry";
import { ComponentPreview } from "@/components/ComponentPreview";
import { TokenReference } from "@/components/TokenReference";
import { AuditPanel } from "@/components/AuditPanel";
import { LandingGrid } from "./LandingGrid";
import { COMPONENT_ROUTES } from "./uiKitGroups";

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
      case "preview": return <ComponentPreview componentId={route.componentId} />;
    }
  }

  const components = getComponents(activeSystem);
  if (!components.find(c => c.id === selectedComponent)) return <LandingGrid />;
  return <ComponentPreview componentId={selectedComponent} />;
}
