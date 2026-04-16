"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents } from "@/data/registry";
import { ComponentPreview } from "@/components/ComponentPreview";
import { TokenReference } from "@/components/TokenReference";
import { AuditPanel } from "@/components/AuditPanel";
import { LandingGrid } from "./LandingGrid";

export function MainContent() {
  const selectedComponent = useDesignHub((s) => s.selectedComponent);
  const activeSystem = useDesignHub((s) => s.activeSystem);

  if (selectedComponent === "tokens") return <TokenReference />;
  if (selectedComponent === "audit") return <AuditPanel />;
  if (selectedComponent === "charts") return <ComponentPreview componentId="charts" />;

  if (!selectedComponent) return <LandingGrid />;
  const components = getComponents(activeSystem);
  if (!components.find(c => c.id === selectedComponent)) return <LandingGrid />;
  return <ComponentPreview componentId={selectedComponent} />;
}
