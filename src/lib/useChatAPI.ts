"use client";

import { useCallback, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";
import { parseAIResponse } from "./parseAIResponse";
import { applyAIActions } from "./applyAIActions";

/**
 * Hook that sends messages to the Claude API endpoint and streams the response.
 * Falls back gracefully if the API is unavailable.
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

    // Add current message
    history.push({ role: "user", content: userText });

    // Add context about current state
    const context = `[Current state: design_system=${store.designSystem}, mode=${store.mode}, density=${store.density}, interface_type=${store.interfaceType}, selected_components=[${store.selectedComponents.join(",")}]]`;
    history[history.length - 1] = {
      role: "user",
      content: `${context}\n\n${userText}`,
    };

    store.setGenerating(true);

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      // Add placeholder AI message
      store.addMessage("ai", "...");
      const aiMsgIndex = store.messages.length; // index of the message we just added

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
                // Update the last AI message in-place
                const msgs = useBuilder.getState().messages;
                const lastAi = msgs[msgs.length - 1];
                if (lastAi && lastAi.role === "ai") {
                  useBuilder.setState({
                    messages: [
                      ...msgs.slice(0, -1),
                      { ...lastAi, content: accumulated },
                    ],
                  });
                }
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      }

      // Parse final response for actions
      const { displayText, actions } = parseAIResponse(accumulated);

      // Update message with clean display text (no JSON blocks)
      const finalMsgs = useBuilder.getState().messages;
      const lastAi = finalMsgs[finalMsgs.length - 1];
      if (lastAi && lastAi.role === "ai") {
        useBuilder.setState({
          messages: [
            ...finalMsgs.slice(0, -1),
            { ...lastAi, content: displayText },
          ],
        });
      }

      // Apply any actions from the response
      if (actions.length > 0) {
        applyAIActions(actions);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;

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
