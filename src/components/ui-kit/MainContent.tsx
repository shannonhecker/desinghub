"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents } from "@/data/registry";
import { ComponentPreview } from "@/components/ComponentPreview";
import { TokenReference } from "@/components/TokenReference";
import { AuditPanel } from "@/components/AuditPanel";
import { LandingGrid } from "./LandingGrid";

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

  if (selectedComponent === "tokens") return <TokenReference />;
  if (selectedComponent === "audit") return <AuditPanel />;
  if (selectedComponent === "builder-blocks") return <BuilderBlockGallery />;
  if (selectedComponent === "charts") return <ComponentPreview componentId="charts" />;

  if (!selectedComponent) return <LandingGrid />;
  const components = getComponents(activeSystem);
  if (!components.find(c => c.id === selectedComponent)) return <LandingGrid />;
  return <ComponentPreview componentId={selectedComponent} />;
}
