"use client";

/* Official design-system token CSS, loaded on /builder so the in-app
   Simulated components render with REAL Salt/Carbon token VALUES (#9 PR-2a).

   - `@salt-ds/theme/index.css` defines `--salt-*` ONLY under `.salt-theme` /
     `.salt-density-*` selectors (no `:root`, no `html`/`body`/`*` reset —
     verified), so it is naturally scoped: it can only affect elements that
     opt in with `.salt-theme`. The preview wrapper adds that class for Salt
     via getPreviewOfficialScope, so the official `--salt-*` resolve there and
     the `.preview-salt` bridge in builder.css reads genuine Salt values.
   - <OfficialTokenStyles> injects the OFFICIAL Carbon `--cds-*` values (from
     @carbon/themes) scoped under `.preview-carbon` / `.preview-carbon
     [data-cds-theme]`. We deliberately do NOT import @carbon/styles (a 950 KB
     global reset that would leak app-wide). */
import "@salt-ds/theme/index.css";

import { BuilderApp } from "@/components/builder/BuilderApp";
import { OfficialTokenStyles } from "@/components/ui-kit/OfficialTokenStyles";

export default function BuilderPage() {
  return (
    <>
      <OfficialTokenStyles />
      <BuilderApp />
    </>
  );
}
