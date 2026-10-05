"use client";

/* The same library as /ui-kit, served for links that carry a place
   (/ui-kit?c=...; see the rewrite in next.config.ts). The address bar still
   reads /ui-kit. This variant holds the main column until the place from the
   URL is applied, so a link to Carbon's Button, Code tab never draws the
   overview first; the plain /ui-kit page has its overview in the server HTML.
   Both are static. */
import "@salt-ds/theme/index.css";

import { DesignHubApp } from "@/components/DesignHubApp";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OfficialTokenStyles } from "@/components/ui-kit/OfficialTokenStyles";

export default function UIKitEntryPage() {
  return (
    <ThemeProvider>
      <OfficialTokenStyles />
      <DesignHubApp held />
    </ThemeProvider>
  );
}
