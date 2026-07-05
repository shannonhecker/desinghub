/**
 * Browser-side mocks for the builder chat pipeline.
 *
 * Registers context.route interceptions for:
 *   /api/health - ChatPanel gates the whole AI path on this one-shot
 *                 probe (useBackendStatus). Without a mocked healthy
 *                 response every message is swallowed by the offline
 *                 wizard and /api/chat is never called - a green-but-
 *                 wrong suite.
 *   /api/chat   - fulfilled with an SSE-style body in the exact format
 *                 useChatAPI's reader parses: newline-separated
 *                 "data: {json}" lines ending with "data: [DONE]".
 *                 Actions ride inside the reply text as json fences
 *                 (parseAIResponse).
 *
 * Anti-silent-green: prompts that match no rule are answered with the
 * E2E-MOCK-MISS sentinel and counted; every test asserts the sentinel
 * never rendered and the interception count matches its sends.
 *
 * Register BEFORE page.goto so the mount-time health probe is caught.
 */

import type { BrowserContext } from "@playwright/test";

export const MOCK_MISS = "E2E-MOCK-MISS";

export interface ChatMockRule {
  /** Tested against the user-typed text (context prefix stripped). */
  match: RegExp;
  /** Full assistant reply, including any json action fences. */
  reply: (typed: string) => string;
}

export interface ChatMockState {
  chatCalls: number;
  missCount: number;
  posts: Array<{
    designSystem?: string;
    messages?: Array<{ role: string; content: string }>;
  }>;
}

/** Build an SSE body the useChatAPI reader accepts. Splits the text
 *  into two frames so accumulation is lightly exercised; JSON.stringify
 *  keeps each frame single-line (multi-line frames are dropped). */
export function sseBody(text: string): string {
  const mid = Math.ceil(text.length / 2);
  const frames = [text.slice(0, mid), text.slice(mid)].filter((t) => t.length > 0);
  return (
    frames.map((t) => `data: ${JSON.stringify({ text: t })}\n\n`).join("") +
    "data: [DONE]\n\n"
  );
}

/** Wrap one action object in the json fence parseAIResponse expects
 *  (one JSON object per fence). */
export function fence(action: Record<string, unknown>): string {
  return "```json\n" + JSON.stringify(action) + "\n```";
}

export async function installChatMocks(
  context: BrowserContext,
  opts: { anthropicConfigured: boolean; rules?: ChatMockRule[] },
): Promise<ChatMockState> {
  const state: ChatMockState = { chatCalls: 0, missCount: 0, posts: [] };

  await context.route("**/api/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        anthropicConfigured: opts.anthropicConfigured,
        firebaseConfigured: false,
      }),
    });
  });

  await context.route("**/api/chat", async (route) => {
    state.chatCalls += 1;
    const post = (route.request().postDataJSON() ?? {}) as ChatMockState["posts"][number];
    state.posts.push(post);

    const users = (post.messages ?? []).filter((m) => m.role === "user");
    const content = users[users.length - 1]?.content ?? "";
    /* useChatAPI prefixes the typed text with "[Current state: ...]"
       followed by a blank line - strip it to match on what was typed. */
    const typed = content.startsWith("[Current state:")
      ? content.split("\n\n").slice(1).join("\n\n")
      : content;

    const rule = (opts.rules ?? []).find((r) => r.match.test(typed));
    const reply = rule
      ? rule.reply(typed)
      : `${MOCK_MISS}: no mock rule matched: ${typed}`;
    if (!rule) state.missCount += 1;

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: sseBody(reply),
    });
  });

  return state;
}

/* Copy classes the suite asserts never appear in the chat log. */

/** Refusal shapes for "add another X" (the regression this suite pins). */
export const REFUSAL_COPY =
  /already (has|have)|only one table|at most one table|instead of adding|can['’]?t add|cannot add|won['’]?t add/i;

/** useChatAPI error-prefix copy (CHAT_ERROR_PREFIXES). */
export const CHAT_ERROR_COPY =
  /I'm having trouble connecting|AI is off|Rate limit|Something went wrong on the server|I could not reach the server|That request was too big/;
