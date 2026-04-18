"use client";

import { useCallback, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";
import { parseAIResponse } from "./parseAIResponse";
import { applyAIActions } from "./applyAIActions";

/**
 * Hook that sends messages to the Claude API endpoint and streams the response.
 * Uses requestAnimationFrame to batch streaming state updates at 60fps
 * instead of per-SSE-chunk (~500+ updates per response).
 */
export function useChatAPI() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userText: string): Promise<void> => {
    const store = useBuilder.getState();

    // Build message history for context (last 20 messages)
    const history = store.messages.slice(-20).map((m) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.content,
    }));

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
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      // Add placeholder AI message
      store.addMessage("ai", "...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                scheduleFlush();
              }
            } catch {
              // Skip malformed SSE data
            }
          }
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

      // Apply any actions from the response
      if (actions.length > 0) {
        applyAIActions(actions);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;

      // Cancel pending RAF on error
      if (rafId !== null) cancelAnimationFrame(rafId);

      // On failure, update the AI message with error
      const msgs = useBuilder.getState().messages;
      const lastAi = msgs[msgs.length - 1];
      if (lastAi && lastAi.role === "ai" && lastAi.content === "...") {
        useBuilder.setState({
          messages: [
            ...msgs.slice(0, -1),
            { ...lastAi, content: "I'm having trouble connecting right now. Please try again in a moment." },
          ],
        });
      }
    } finally {
      useBuilder.getState().setGenerating(false);
      abortRef.current = null;
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
