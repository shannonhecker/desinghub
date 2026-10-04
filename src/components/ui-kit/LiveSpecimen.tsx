"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getDemoComponent } from "@/data/registry";

/**
 * The real demo of one registry entry, rendered live through the active
 * system at true size. Used by the overview wall and the detail stage, so a
 * card shows the same component the detail page documents.
 *
 * A wall of live demos is heavy, so each one mounts only once it is near the
 * viewport and then stays mounted. Until then the stage keeps its size (no
 * layout shift when it arrives).
 */
export function LiveSpecimen({ id, eager = false }: { id: string; eager?: boolean }) {
  const system = useDesignHub((s) => s.activeSystem);
  const carbonTheme = useDesignHub((s) => s.carbon.themeKey);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [near, setNear] = React.useState(eager);

  React.useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const Demo = near ? getDemoComponent(system, id) : null;
  /* The system's own scope classes, so its CSS resolves exactly as on the
     detail page. The specimen itself is never restyled. */
  const scope = system === "uoaui" ? "preview-uoaui a-app" : system === "carbon" ? `cds--${carbonTheme}` : undefined;

  return (
    <div ref={ref} className="kit-specimen" data-specimen={id} data-live={Demo ? "true" : "false"}>
      {Demo ? <div className={scope}><Demo /></div> : null}
    </div>
  );
}
