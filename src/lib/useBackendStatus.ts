"use client";

/**
 * useBackendStatus - one-shot probe of /api/health on mount.
 *
 * The server reports which env-gated features (Anthropic, Firebase)
 * are configured. We hydrate the Zustand store so any component can
 * gate UI on `backendStatus.anthropicConfigured` / `.firebaseConfigured`
 * without making its own fetch.
 *
 * Error policy: if the health probe itself fails (network, server
 * error), we leave the store at its initial `null` values. `null` is
 * treated by downstream consumers as "assume configured" - we'd
 * rather let an AI call fail loudly than pre-emptively disable UI
 * when we're not sure what the server state is.
 *
 * The effect runs exactly once per Builder mount - StrictMode's
 * double-mount is handled by the ref guard so we don't fire two
 * fetches on dev refresh.
 */

import { useEffect, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";

export function useBackendStatus() {
  const setBackendStatus = useBuilder((s) => s.setBackendStatus);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/health", { method: "GET" });
        if (!res.ok) return; // leave store at null - "unknown"
        const data = (await res.json()) as {
          anthropicConfigured?: boolean;
          firebaseConfigured?: boolean;
        };
        if (cancelled) return;
        setBackendStatus({
          anthropicConfigured: Boolean(data.anthropicConfigured),
          firebaseConfigured: Boolean(data.firebaseConfigured),
        });
      } catch {
        /* Network error or server unreachable. Leave as null so the
           UI stays optimistic; the first failing AI call will surface
           a meaningful error instead. */
      }
    })();

    return () => { cancelled = true; };
  }, [setBackendStatus]);
}
