import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID } from "@/lib/chatSystem";
import {
  buildSystemPrompt,
  VALID_DESIGN_SYSTEMS,
} from "@/lib/buildSystemPrompt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireBuilderAuth } from "@/lib/apiAuth";
import { CANVAS_TOOLS } from "@/lib/chatTools";

const MAX_MESSAGES = 40;
/* Per-message ceiling. The current turn carries the [Current state: ...]
   block with the canvas manifest (bounded at MANIFEST_MAX_CHARS) ahead of the
   user's text, so the limit leaves room for both. */
const MAX_CONTENT_LENGTH = 16000;

function isValidMessage(m: unknown): m is { role: string; content: string } {
  if (typeof m !== "object" || m === null) return false;
  const msg = m as Record<string, unknown>;
  return (
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    msg.content.length <= MAX_CONTENT_LENGTH
  );
}

let client: Anthropic | null = null;
let clientKey: string | null = null;
function getClient(apiKey: string): Anthropic {
  if (!client || clientKey !== apiKey) {
    client = new Anthropic({ apiKey });
    clientKey = apiKey;
  }
  return client;
}

export async function POST(req: Request) {
  /* Staging gate: the middleware skips /api/*, so without this the AI
     routes were reachable without the staging password (open proxy to the
     Anthropic key). Public mode (no STAGING_PASSWORD) passes straight through. */
  const denied = await requireBuilderAuth(req);
  if (denied) return denied;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting — per-route bucket so chat traffic doesn't lock out
  // staging-login or builder/generate-content for the same IP.
  const ip = getClientIp(req);
  const limit = await checkRateLimit(ip, "chat");
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limit.resetInSeconds),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, designSystem } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: `messages must be an array of 1-${MAX_MESSAGES} items` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!messages.every(isValidMessage)) {
    return new Response(
      JSON.stringify({ error: "Each message must have role (user|assistant) and content (string)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  /* Strict allowlist guard. Anything non-canonical (including
     prompt-injection attempts like "<script>...") is rejected
     before the value can be folded into the system prompt. */
  if (
    designSystem !== undefined &&
    (typeof designSystem !== "string" ||
      !(VALID_DESIGN_SYSTEMS as readonly string[]).includes(designSystem))
  ) {
    return new Response(
      JSON.stringify({
        error: `designSystem must be one of: ${VALID_DESIGN_SYSTEMS.join(", ")}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validatedMessages = messages as { role: "user" | "assistant"; content: string }[];
  const anthropic = getClient(apiKey);

  /* Prompt caching: the ~18KB DS-aware SYSTEM_PROMPT is byte-stable per design
     system (5 warm prefixes), well above the ~1024-token minimum, so cache it
     with an ephemeral breakpoint. Render order is system → messages, so the
     volatile turn content stays after the cached prefix. ~90% cheaper on the
     cached tokens + faster TTFT across the multi-turn loop. Verify via the
     cache_read log below (should be > 0 from the 2nd request onward).

     max_tokens raised 4096 → 16000: it is a per-response ceiling, not a
     reservation (billed on actual output), so headroom is free and it closes
     the mid-layout truncation trap. Streaming has no HTTP-timeout concern. */
  /* Canvas actions are TOOLS (chatTools.ts): the model returns each change
     as a structured tool_use block instead of a ```json fence in its prose.
     The tool list is a stable constant and renders ahead of `system` in the
     cache prefix, so it caches with the prompt. Input streaming is left in
     its default (buffered) mode on purpose: the API then validates each
     parameter before it is emitted, so the accumulated input is always
     complete JSON when its block closes; the inputs are small. */
  const stream = await anthropic.messages.stream({
    model: MODEL_ID,
    max_tokens: 16000,
    tools: CANVAS_TOOLS,
    system: [
      {
        type: "text",
        text: buildSystemPrompt((designSystem as string | undefined) ?? "salt"),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: validatedMessages,
  });

  const encoder = new TextEncoder();

  /* Tool-use blocks arrive as content_block_start (name) → N input_json_delta
     fragments → content_block_stop. Accumulate per block index and emit one
     `{tool_use: {name, input}}` frame when the block closes, in the order the
     model emitted them (order matters: setZoneLayout before addBlock). */
  const pendingTools = new Map<number, { name: string; json: string }>();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (frame: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      try {
        for await (const event of stream) {
          /* Cache-hit telemetry: message_start carries the input-token usage,
             incl. cache_read / cache_creation. Logged once per request so the
             prompt-cache can be confirmed working (cache_read > 0 after the
             first warm-up). Server-side only; never reaches the client. */
          if (event.type === "message_start") {
            const u = event.message.usage;
            console.log(
              `[api/chat] cache_read=${u.cache_read_input_tokens ?? 0} ` +
                `cache_creation=${u.cache_creation_input_tokens ?? 0} ` +
                `input=${u.input_tokens}`,
            );
          }
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ text: event.delta.text });
          } else if (
            event.type === "content_block_start" &&
            event.content_block.type === "tool_use"
          ) {
            pendingTools.set(event.index, { name: event.content_block.name, json: "" });
          } else if (
            event.type === "content_block_delta" &&
            event.delta.type === "input_json_delta"
          ) {
            const pending = pendingTools.get(event.index);
            if (pending) pending.json += event.delta.partial_json;
          } else if (event.type === "content_block_stop") {
            const pending = pendingTools.get(event.index);
            if (!pending) continue;
            pendingTools.delete(event.index);
            let input: unknown;
            try {
              input = pending.json.trim() ? JSON.parse(pending.json) : {};
            } catch {
              /* Should not happen with buffered input streaming; if it does,
                 tell the client which call was lost rather than dropping it. */
              send({ tool_skipped: { name: pending.name, reason: "invalid tool input JSON" } });
              continue;
            }
            send({ tool_use: { name: pending.name, input } });
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
