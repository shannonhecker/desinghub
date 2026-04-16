"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeBuilder } from "@/components/ui-kit/ThemeBuilder";

export default function ThemeBuilderPage() {
  return (
    <ThemeProvider>
      <ThemeBuilder />
    </ThemeProvider>
  );
}
