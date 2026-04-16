"use client";

import { DesignHubApp } from "@/components/DesignHubApp";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function UIKitPage() {
  return (
    <ThemeProvider>
      <DesignHubApp />
    </ThemeProvider>
  );
}
