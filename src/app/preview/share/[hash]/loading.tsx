import "@/components/builder/builder.css";

/**
 * Loading UI for /preview/share/[hash].
 *
 * The page is a server component that runs decodeShareState synchronously,
 * but Next.js may briefly show this UI during navigation or cold-start
 * latency. Matches the shared-preview chrome + grid shape so the transition
 * into real content doesn't jolt the eye.
 *
 * Shapes use --b-surface at low alpha via pulsing opacity so the skeleton
 * respects the active theme without hardcoding a gray.
 */
export default function Loading() {
  return (
    <main className="shared-preview" aria-busy="true" aria-label="Loading shared canvas">
      <header className="shared-preview-header">
        <div className="shared-preview-brand">
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18, marginRight: 6 }}>
            share
          </span>
          <strong>Shared preview</strong>
        </div>
        <div className="shared-preview-skel-row" aria-hidden="true">
          <span className="shared-preview-skel shared-preview-skel-chip" />
          <span className="shared-preview-skel shared-preview-skel-chip" />
          <span className="shared-preview-skel shared-preview-skel-chip" />
        </div>
        <div className="shared-preview-skel-row" aria-hidden="true">
          <span className="shared-preview-skel shared-preview-skel-icon-btn" />
          <span className="shared-preview-skel shared-preview-skel-btn" />
        </div>
      </header>

      <div className="shared-preview-body" aria-hidden="true">
        <div className="bp-dashboard">
          <main className="bp-main shared-preview-main">
            <div className="shared-preview-grid">
              <div className="shared-preview-skel shared-preview-skel-card" />
              <div className="shared-preview-skel shared-preview-skel-card" />
              <div className="shared-preview-skel shared-preview-skel-card" />
              <div className="shared-preview-skel shared-preview-skel-card" />
              <div className="shared-preview-skel shared-preview-skel-card" />
              <div className="shared-preview-skel shared-preview-skel-card" />
            </div>
          </main>
        </div>
      </div>
    </main>
  );
}
