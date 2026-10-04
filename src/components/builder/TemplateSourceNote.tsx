/* Credit for the finance templates' sources. Shown beside the gallery, never
   inside a template canvas. */
export function TemplateSourceNote() {
  return (
    <p className="template-source-note">
      Finance templates adapted from Shannon Hecker’s{" "}
      <a href="https://jpm-analytics-dashboard-shannon-h.vercel.app/" target="_blank" rel="noopener noreferrer">Analytics Dashboard</a>
      {" "}and{" "}
      <a href="https://shannonhecker.github.io/fx-execution-analytics/" target="_blank" rel="noopener noreferrer">FX Execution Analytics</a>.
    </p>
  );
}
