import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID } from "@/lib/chatSystem";
import {
  buildSystemPrompt,
  VALID_DESIGN_SYSTEMS,
} from "@/lib/buildSystemPrompt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 8000;

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
  const stream = await anthropic.messages.stream({
    model: MODEL_ID,
    max_tokens: 16000,
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

  const readable = new ReadableStream({
    async start(controller) {
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
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
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
