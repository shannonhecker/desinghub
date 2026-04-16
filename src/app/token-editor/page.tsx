"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { TokenEditor } from "@/components/ui-kit/TokenEditor";

export default function TokenEditorPage() {
  return (
    <ThemeProvider>
      <TokenEditor />
    </ThemeProvider>
  );
}
