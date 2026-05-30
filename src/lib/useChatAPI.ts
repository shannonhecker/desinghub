"use client";

import { useCallback, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";
import { parseAIResponse } from "./parseAIResponse";
import { applyAIActions } from "./applyAIActions";
import { cleanHistoryForAPI } from "./cleanMessageHistory";

/**
 * Hook that sends messages to the Claude API endpoint and streams the response.
 * Uses requestAnimationFrame to batch streaming state updates at 60fps
 * instead of per-SSE-chunk (~500+ updates per response).
 */
export function useChatAPI() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userText: string): Promise<void> => {
    const store = useBuilder.getState();

    /* Build message history for context (last 20 turns).
       cleanHistoryForAPI strips the `[Current state: ...]\n\n` prefix
       from PRIOR turns - the current turn's prefix is freshly injected
       below so the API only ever sees one authoritative state snapshot
       per request. Without this, prefixes from previous turns stack
       up as stale context noise (G7 + G15). */
    const history = cleanHistoryForAPI(store.messages);

    // Add current message with context - includes the clicked/selected
    // block when the user has scoped their message to a specific element.
    const allZoneBlocks = [
      ...store.headerBlocks,
      ...store.sidebarBlocks,
      ...store.blocks,
      ...store.footerBlocks,
    ];
    const selectedBlock = store.selectedBlockId
      ? allZoneBlocks.find((b) => b.id === store.selectedBlockId)
      : null;
    // Serialize props safely - if anything non-JSON slipped in (function,
    // circular ref, DOM node) we don't want to crash the chat pipeline.
    let propsJson = "{}";
    if (selectedBlock) {
      try {
        propsJson = JSON.stringify(selectedBlock.props);
      } catch {
        propsJson = '{"_error":"props not serializable"}';
      }
      // Cap context size so a huge prop doesn't blow the token budget
      if (propsJson.length > 2000) propsJson = propsJson.slice(0, 1997) + "...";
    }
    const selectedSuffix = selectedBlock
      ? `, selected_block={id:"${selectedBlock.id}", type:"${selectedBlock.type}", zone:"${store.selectedBlockZone ?? ""}", props:${propsJson}}`
      : "";
    const context = `[Current state: design_system=${store.designSystem}, mode=${store.mode}, density=${store.density}, interface_type=${store.interfaceType}, selected_components=[${store.selectedComponents.join(",")}]${selectedSuffix}]`;
    history.push({ role: "user", content: `${context}\n\n${userText}` });

    store.setGenerating(true);

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // RAF-batched accumulator
    let accumulated = "";
    let rafId: number | null = null;

    const flushToStore = () => {
      rafId = null;
      const msgs = useBuilder.getState().messages;
      const lastAi = msgs[msgs.length - 1];
      if (lastAi && lastAi.role === "ai") {
        useBuilder.setState({
          messages: [...msgs.slice(0, -1), { ...lastAi, content: accumulated }],
        });
      }
    };

    const scheduleFlush = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(flushToStore);
      }
    };

    try {
      const basePath = (typeof window !== "undefined" && (window as unknown as Record<string, Record<string, string>>).__NEXT_DATA__?.basePath) || "";
      const res = await fetch(`${basePath}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        /* Phase 4: forward the active DS so the route can build a
           DS-aware system prompt. Route validates against an
           allowlist; arbitrary strings get rejected with 400. */
        body: JSON.stringify({
          messages: history,
          designSystem: store.designSystem,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        /* Distinguish "AI feature disabled" (503 from the route's
           missing-key guard) from other server errors. useBackendStatus
           usually gates the UI before we reach here, but a fast send
           before the health probe resolves can still land here. */
        if (res.status === 503) {
          let serverError = "";
          try {
            const body = (await res.json()) as { error?: string };
            serverError = body.error ?? "";
          } catch { /* ignore */ }
          if (serverError === "ANTHROPIC_API_KEY not configured") {
            throw new Error("AI_OFF");
          }
        }
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      // Add placeholder AI message
      store.addMessage("ai", "...");

      // Carry over the trailing partial line between chunk reads. Without
      // this, a `data: {...}` event split across two network reads gets
      // dropped silently in the JSON.parse catch — visible to the user
      // as truncated/garbled streamed messages and (worse) lost actions.
      let leftover = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Keep the last segment as `leftover` for the next iteration
        // so an incomplete `data: {...` doesn't hit JSON.parse mid-event.
        const lines = (leftover + chunk).split("\n");
        leftover = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            let parsed: { text?: string; error?: string } | null = null;
            try {
              parsed = JSON.parse(data);
            } catch {
              // Skip malformed SSE data
            }
            /* Surface mid-stream server errors instead of swallowing them.
               The route emits {error} frames on stream failure (route.ts).
               Throw OUTSIDE the JSON.parse try so it isn't re-caught here —
               it propagates to the outer catch, which shows the user-facing
               error and flips the LifecyclePill to its error state. */
            if (parsed?.error) throw new Error(parsed.error);
            if (parsed?.text) {
              accumulated += parsed.text;
              scheduleFlush();
            }
          }
        }
      }

      // Process any final residual line that didn't end with "\n"
      // before [DONE] / connection close.
      if (leftover.startsWith("data: ")) {
        const data = leftover.slice(6);
        if (data && data !== "[DONE]") {
          let parsed: { text?: string; error?: string } | null = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            // Skip malformed final fragment
          }
          if (parsed?.error) throw new Error(parsed.error);
          if (parsed?.text) accumulated += parsed.text;
        }
      }

      // Final flush - cancel pending RAF and do a synchronous update
      if (rafId !== null) cancelAnimationFrame(rafId);
      flushToStore();

      // Parse final response for actions
      const { displayText, actions } = parseAIResponse(accumulated);

      // Update message with clean display text (no JSON blocks)
      const finalMsgs = useBuilder.getState().messages;
      const lastAi = finalMsgs[finalMsgs.length - 1];
      if (lastAi && lastAi.role === "ai") {
        useBuilder.setState({
          messages: [...finalMsgs.slice(0, -1), { ...lastAi, content: displayText }],
        });
      }

      // Apply any actions from the response.
      // Phase 3a (N4): pass `lastAi.id` so each emitted tool-use event
      // ties back to the assistant bubble that produced it. ChatPanel
      // groups events by messageId to render the inline cards.
      if (actions.length > 0) {
        applyAIActions(actions, lastAi?.id);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        /* Stopping should leave a legible marker, not a dangling "...".
           Cancel any pending flush, then finalize the in-flight bubble:
           a bare placeholder becomes "Stopped.", a partial stream keeps its
           text with a "(stopped)" note. `finally` still clears generating. */
        if (rafId !== null) cancelAnimationFrame(rafId);
        const msgs = useBuilder.getState().messages;
        const lastAi = msgs[msgs.length - 1];
        if (lastAi && lastAi.role === "ai") {
          const stopped =
            lastAi.content === "..." || lastAi.content.trim() === ""
              ? "Stopped."
              : `${lastAi.content}\n\n(stopped)`;
          useBuilder.setState({
            messages: [...msgs.slice(0, -1), { ...lastAi, content: stopped }],
          });
        }
        return;
      }

      // Cancel pending RAF on error
      if (rafId !== null) cancelAnimationFrame(rafId);

      /* Pick a user-facing message based on the specific failure.
         "AI_OFF" is our internal sentinel for the missing-key case
         (thrown above), everything else gets the generic connection
         fallback. */
      const errorMessage =
        err instanceof Error && err.message === "AI_OFF"
          ? "AI is off - add ANTHROPIC_API_KEY to .env.local and restart the dev server. Templates and manual edits still work."
          : "I'm having trouble connecting right now. Please try again in a moment.";

      // On failure, update the AI message with error
      const msgs = useBuilder.getState().messages;
      const lastAi = msgs[msgs.length - 1];
      if (lastAi && lastAi.role === "ai" && lastAi.content === "...") {
        useBuilder.setState({
          messages: [
            ...msgs.slice(0, -1),
            { ...lastAi, content: errorMessage },
          ],
        });
      } else {
        /* No placeholder message in flight (the error hit before we
           could even add "..."). Surface the error as a new AI
           message so the user still sees something. */
        useBuilder.getState().addMessage("ai", errorMessage);
      }
    } finally {
      useBuilder.getState().setGenerating(false);
      // Only clear abortRef if this call still owns it. Without this guard,
      // a rapid double-send would have the first finally clear the second
      // request's controller, making the second stream un-abortable.
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { sendMessage, abort };
}
