"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { TokenEditor } from "@/components/ui-kit/TokenEditor";
import { ToolPageShell } from "@/components/ui-kit/ToolPageShell";

export default function TokenEditorPage() {
  return (
    <ThemeProvider>
      <ToolPageShell><TokenEditor /></ToolPageShell>
    </ThemeProvider>
  );
}
