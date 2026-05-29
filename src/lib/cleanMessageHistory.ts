import type { ChatMessage } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   cleanMessageHistory - strip the `[Current state: ...]\n\n`
   prefix that useChatAPI injects onto the CURRENT turn from
   ALL prior turns before sending history to the chat API.

   Why this exists:
   - useChatAPI prepends a `[Current state: design_system=...,
     mode=..., density=..., interface_type=..., selected_
     components=[...]<, selected_block=...>]\n\n` block to the
     current user message so Claude knows the live builder
     context. That string is then stored in `messages` as part
     of the user content for that turn.
   - On turn N+1, the prior turn's content already carries that
     prefix. Sending it again pollutes the context window: the
     model sees N-1 stale state snapshots stacked next to the
     authoritative one on turn N.
   - This utility strips the prefix from ALL prior turns. The
     current turn's prefix is injected fresh by the caller, so
     it stays untouched.
   ══════════════════════════════════════════════════════════ */

const CONTEXT_PREFIX = /^\[Current state:[\s\S]*?\]\n\n/;

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

/** Strip the `[Current state: ...]\n\n` prefix injected on prior
 *  turns and trim history to last 20 turns. The current turn's
 *  prefix is injected fresh by the caller - only PRIOR turns get
 *  cleaned via this helper. Also normalises the store's "ai" role
 *  to Anthropic's "assistant" role. */
export function cleanHistoryForAPI(messages: ChatMessage[]): AnthropicMessage[] {
  return messages.slice(-20).map((m) => ({
    role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
    content: m.content.replace(CONTEXT_PREFIX, ""),
  }));
}
