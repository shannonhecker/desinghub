"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getSystemInfo } from "@/data/registry";
import { SYSTEM_LABEL, kitHref, resolveEquivalent } from "./kitEquivalence";

/** Plain left click only: modified clicks keep the real link behaviour. */
const plain = (e: React.MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/**
 * Shown when the visitor switched to a system that has no equivalent of the
 * entry they were on. It keeps their place (same entry in the URL, same
 * header and switcher), says so plainly, offers the closest matches as real
 * links, and leads back to the system that has it. It never redirects.
 */
export function NotInSystem() {
  const system = useDesignHub((s) => s.activeSystem);
  const missing = useDesignHub((s) => s.missing);
  const setSelected = useDesignHub((s) => s.setSelectedComponent);
  const setSystem = useDesignHub((s) => s.setActiveSystem);
  if (!missing) return null;
  const eq = resolveEquivalent(missing.from, missing.id, system);
  const sourceName = getComponents(missing.from).find((c) => c.id === missing.id)?.name ?? eq.label;
  const names = new Map(getComponents(system).map((c) => [c.id, c.name]));

  return (
    <div className="kit-nis" data-testid="not-in-system">
      <div className="kit-nis-card">
        {eq.systemOnly ? (
          <>
            <h1>{SYSTEM_LABEL[system]} has no {eq.label}.</h1>
            <p>{sourceName} is {getSystemInfo(missing.from).name}&rsquo;s own, so there is no page to show here.</p>
          </>
        ) : (
          <>
            <h1>This library has no {eq.label} page for {SYSTEM_LABEL[system]} yet.</h1>
            <p>This is a gap in the library, not a statement about {getSystemInfo(system).name}. The closest pages it has:</p>
          </>
        )}
        <h2>{eq.systemOnly ? `Closest in ${SYSTEM_LABEL[system]}` : `Here for ${SYSTEM_LABEL[system]}`}</h2>
        <ul>
          {eq.closest.map((c) => (
            <li key={c.id}>
              <a className="kit-btn is-tonal" href={kitHref({ ds: system, c: c.id })} onClick={(e) => { if (!plain(e)) return; e.preventDefault(); setSelected(c.id); }}>
                {names.get(c.id) ?? c.label}
              </a>
            </li>
          ))}
        </ul>
        <h2>Or go back</h2>
        <ul>
          <li>
            <a className="kit-btn" href={kitHref({ ds: missing.from, c: missing.id })} onClick={(e) => { if (!plain(e)) return; e.preventDefault(); setSystem(missing.from); }}>
              {sourceName} in {SYSTEM_LABEL[missing.from]}
            </a>
          </li>
          <li>
            <a className="kit-btn" href={kitHref({ ds: system })} onClick={(e) => { if (!plain(e)) return; e.preventDefault(); useDesignHub.setState({ missing: null, selectedComponent: null }); }}>
              {SYSTEM_LABEL[system]} overview
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
