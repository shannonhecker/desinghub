"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeBuilder } from "@/components/ui-kit/ThemeBuilder";
import { ToolPageShell } from "@/components/ui-kit/ToolPageShell";

export default function ThemeBuilderPage() {
  return (
    <ThemeProvider>
      <ToolPageShell><ThemeBuilder /></ToolPageShell>
    </ThemeProvider>
  );
}
