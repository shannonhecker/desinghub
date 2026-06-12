"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { parseAIResponse } from "./parseAIResponse";
import { applyAIActions } from "./applyAIActions";
import { cleanHistoryForAPI } from "./cleanMessageHistory";

/* ── Differentiated failure states (QW4) ──
   One copy table so ChatPanel (LifecyclePill error detection, retry
   affordance) and tests read the exact strings the hook writes. */
export const CHAT_ERROR_COPY = {
  aiOff:
    "AI is off - add ANTHROPIC_API_KEY to .env.local and restart the dev server. Templates and manual edits still work.",
  rateLimit: (seconds: number) => `Rate limit reached. Retry in ${seconds}s.`,
  rateLimitCleared: "Rate limit cleared. You can send again.",
  server: "Something went wrong on the server. Use Retry to send your message again.",
  network:
    "I could not reach the server. Check your connection, then use Retry to send your message again.",
  tooBig:
    "That request was too big for one turn. Try a smaller ask: one section or one change at a time.",
  generic: "I'm having trouble connecting right now. Please try again in a moment.",
} as const;

/* Prefixes ChatPanel uses to classify the last AI message as an error
   for the LifecyclePill. Kept next to the copy so they cannot drift. */
export const CHAT_ERROR_PREFIXES = [
  "I'm having trouble connecting",
  "AI is off",
  "Rate limit",
  "Something went wrong on the server",
  "I could not reach the server",
  "That request was too big",
] as const;

/* Refusal / context-overrun sentinels surfaced by the route's
   mid-stream {error} frames (Anthropic error text passes through
   verbatim - see api/chat/route.ts catch). */
const TOO_BIG_RE =
  /prompt is too long|too many tokens|maximum context|context limit|request_too_large|refus/i;

/* Used when a 429 arrives without a parseable Retry-After header. */
const FALLBACK_RETRY_SECONDS = 30;

export interface FailedSend {
  /* Id of the AI error bubble carrying the retry affordance. */
  messageId: string;
  /* The user text to resend verbatim. */
  userText: string;
}

type ChatErrorKind =
  | "ai-off"
  | "rate-limit"
  | "server"
  | "network"
  | "too-big"
  | "generic";

/* Replace one message's content by id (countdown ticks + retries). */
function setMessageContent(id: string, content: string): void {
  const msgs = useBuilder.getState().messages;
  useBuilder.setState({
    messages: msgs.map((m) => (m.id === id ? { ...m, content } : m)),
  });
}

/**
 * Hook that sends messages to the Claude API endpoint and streams the response.
 * Uses requestAnimationFrame to batch streaming state updates at 60fps
 * instead of per-SSE-chunk (~500+ updates per response).
 *
 * Failure surface (QW4): rather than one generic "trouble connecting"
 * bubble, the hook differentiates
 *   - 429 → live countdown from the Retry-After header; `retrySeconds`
 *     gates send in ChatPanel and re-enables it at zero
 *   - 5xx / network → `failedSend` carries the failed bubble id +
 *     user text so ChatPanel can offer a Retry affordance
 *   - refusal / context-overrun sentinel → "smaller ask" guidance
 *   - missing-key 503 sentinel → existing AI_OFF copy (unchanged)
 */
export function useChatAPI() {
  const abortRef = useRef<AbortController | null>(null);

  /* Seconds left on an active 429 countdown; null when send is open. */
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  /* Latest retryable failure (5xx / network); null otherwise. */
  const [failedSend, setFailedSendState] = useState<FailedSend | null>(null);

  /* Ref mirrors so the stable sendMessage callback never reads stale
     closures, and the interval can be cleared on unmount. */
  const failedSendRef = useRef<FailedSend | null>(null);
  const rateLimitedRef = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setFailedSend = useCallback((value: FailedSend | null) => {
    failedSendRef.current = value;
    setFailedSendState(value);
  }, []);

  useEffect(
    () => () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    },
    [],
  );

  /* Tick the rate-limit bubble down once per second; at zero, swap in
     the cleared copy and reopen send. */
  const startCountdown = useCallback((messageId: string, seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    rateLimitedRef.current = true;
    setRetrySeconds(seconds);
    let remaining = seconds;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setRetrySeconds(remaining);
        setMessageContent(messageId, CHAT_ERROR_COPY.rateLimit(remaining));
      } else {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        rateLimitedRef.current = false;
        setRetrySeconds(null);
        setMessageContent(messageId, CHAT_ERROR_COPY.rateLimitCleared);
      }
    }, 1000);
  }, []);

  const sendMessage = useCallback(async (userText: string): Promise<void> => {
    /* An active 429 countdown blocks new sends until it hits zero.
       ChatPanel disables the send button too; this guard covers
       programmatic callers (chips, wizard, retries). */
    if (rateLimitedRef.current) return;
    /* A fresh attempt supersedes any prior retryable failure. */
    setFailedSend(null);

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
        /* Branch on status BEFORE reading the stream (QW4). */

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
        /* Rate limited: the route already sends Retry-After
           (api/chat/route.ts) - carry it into the countdown. */
        if (res.status === 429) {
          const parsedRetry = Number.parseInt(
            res.headers.get("Retry-After") ?? "",
            10,
          );
          const seconds =
            Number.isFinite(parsedRetry) && parsedRetry > 0
              ? parsedRetry
              : FALLBACK_RETRY_SECONDS;
          throw new Error(`RATE_LIMITED:${seconds}`);
        }
        /* Server-side failure: retryable - the user's text is intact. */
        if (res.status >= 500) throw new Error("SERVER_ERROR");
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

      /* ── Classify the failure (QW4) ──
         Internal sentinels thrown above map to typed kinds; a fetch
         TypeError means the request never reached the server; the
         route's mid-stream {error} frames pass Anthropic error text
         through, so refusal / context-overrun matches TOO_BIG_RE. */
      const message = err instanceof Error ? err.message : "";
      let kind: ChatErrorKind = "generic";
      let waitSeconds = FALLBACK_RETRY_SECONDS;
      if (message === "AI_OFF") {
        kind = "ai-off";
      } else if (message.startsWith("RATE_LIMITED:")) {
        kind = "rate-limit";
        waitSeconds =
          Number(message.slice("RATE_LIMITED:".length)) ||
          FALLBACK_RETRY_SECONDS;
      } else if (message === "SERVER_ERROR") {
        kind = "server";
      } else if (err instanceof TypeError) {
        kind = "network";
      } else if (TOO_BIG_RE.test(message)) {
        kind = "too-big";
      }

      const errorMessage =
        kind === "ai-off"
          ? CHAT_ERROR_COPY.aiOff
          : kind === "rate-limit"
            ? CHAT_ERROR_COPY.rateLimit(waitSeconds)
            : kind === "server"
              ? CHAT_ERROR_COPY.server
              : kind === "network"
                ? CHAT_ERROR_COPY.network
                : kind === "too-big"
                  ? CHAT_ERROR_COPY.tooBig
                  : CHAT_ERROR_COPY.generic;

      /* On failure, surface the error in the thread - replacing the
         "..." placeholder when one is in flight, otherwise as a new
         AI message. Keep the bubble's id: the countdown ticks it and
         the retry affordance anchors to it. */
      const msgs = useBuilder.getState().messages;
      const lastAi = msgs[msgs.length - 1];
      let bubbleId: string;
      if (lastAi && lastAi.role === "ai" && lastAi.content === "...") {
        useBuilder.setState({
          messages: [
            ...msgs.slice(0, -1),
            { ...lastAi, content: errorMessage },
          ],
        });
        bubbleId = lastAi.id;
      } else {
        /* No placeholder message in flight (the error hit before we
           could even add "..."). Surface the error as a new AI
           message so the user still sees something. */
        useBuilder.getState().addMessage("ai", errorMessage);
        const after = useBuilder.getState().messages;
        bubbleId = after[after.length - 1].id;
      }

      if (kind === "rate-limit") {
        startCountdown(bubbleId, waitSeconds);
      } else if (kind === "server" || kind === "network") {
        setFailedSend({ messageId: bubbleId, userText });
      }
    } finally {
      useBuilder.getState().setGenerating(false);
      // Only clear abortRef if this call still owns it. Without this guard,
      // a rapid double-send would have the first finally clear the second
      // request's controller, making the second stream un-abortable.
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [setFailedSend, startCountdown]);

  /* Re-send the text behind the latest retryable failure. Drops the
     error bubble first so the resent history stays clean (the bubble
     would otherwise ride along as a fake assistant turn). */
  const retryFailedSend = useCallback(async (): Promise<void> => {
    const failed = failedSendRef.current;
    if (!failed) return;
    const msgs = useBuilder.getState().messages;
    useBuilder.setState({
      messages: msgs.filter((m) => m.id !== failed.messageId),
    });
    setFailedSend(null);
    await sendMessage(failed.userText);
  }, [sendMessage, setFailedSend]);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { sendMessage, abort, retrySeconds, failedSend, retryFailedSend };
}
