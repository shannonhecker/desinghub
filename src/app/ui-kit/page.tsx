"use client";

/* Official Salt token CSS. This file defines `--salt-*` ONLY under
   `.salt-theme` / `.salt-density-*` class selectors (no `:root`, no global
   reset), so it is naturally scoped — it cannot restyle the builder or any
   other route because nothing outside the Token Reference probe carries those
   classes. Importing here keeps it off every other route's bundle.
   (Carbon's official tokens are emitted as scoped `.preview-carbon` CSS via
   OfficialTokenStyles below — we deliberately do NOT import @carbon/styles,
   which ships a 950 KB global reset that would leak app-wide.) */
import "@salt-ds/theme/index.css";

import { DesignHubApp } from "@/components/DesignHubApp";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OfficialTokenStyles } from "@/components/ui-kit/OfficialTokenStyles";

export default function UIKitPage() {
  return (
    <ThemeProvider>
      <OfficialTokenStyles />
      <DesignHubApp />
    </ThemeProvider>
  );
}
