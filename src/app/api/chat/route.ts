import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID } from "@/lib/chatSystem";
import {
  buildSystemPrompt,
  VALID_DESIGN_SYSTEMS,
} from "@/lib/buildSystemPrompt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireBuilderAuth } from "@/lib/apiAuth";
import { CANVAS_TOOLS } from "@/lib/chatTools";
import {
  IMAGE_REJECTED_ERROR,
  imageContentBlock,
  validateImagePayload,
} from "@/lib/image/validateImagePayload";
import type { ChatImagePayload } from "@/lib/image/imageBytes";

const MAX_MESSAGES = 40;
/* Per-message ceiling. The current turn carries the [Current state: ...]
   block with the canvas manifest (bounded at MANIFEST_MAX_CHARS) ahead of the
   user's text, so the limit leaves room for both. */
const MAX_CONTENT_LENGTH = 16000;
/* Ceiling on model requests per chat turn (the first response plus its
   continuations). A build that batches its calls takes 2-3. Raised from 8:
   on production an image build sent one call per response, used all 8
   steps and stopped mid-layout (Task 16 hotfix). Still a hard stop for a
   model that never finishes asking for tools. */
const MAX_TOOL_STEPS = 20;
/* Said when the cap or the clock, not the model, ended the turn. An image
   is not kept after its turn, so an image build cannot simply "continue":
   the note says what is there and asks for the image again. */
const STEP_CAP_NOTE =
  "I ran out of steps before finishing this layout. Say \"continue\" and I'll build the rest.";
const STEP_CAP_NOTE_IMAGE =
  "I ran out of steps before finishing this layout. What I built so far is on the canvas. " +
  "To finish it, attach the image again and tell me what is missing.";

/* Function time limit (seconds). A long build of one call per step can
   run past the platform default; the loop below stops itself before this
   limit so the user gets a plain note, not a cut stream. */
export const maxDuration = 300;
/* Wall-clock budget for one turn: no new model request starts after this. */
const TURN_BUDGET_MS = 240_000;
/* What the model is told about each canvas call. The calls are applied in
   the browser when the stream ends, so the route can only say they are
   queued - it must not claim an outcome it has not seen. */
const TOOL_QUEUED =
  "Queued. It is applied to the canvas, in order, when your turn ends. " +
  "Blocks you add get their ids then; refer to them by position until the next message.";
const TOOL_REJECTED =
  "Not applied: the arguments were not valid JSON. Call the tool again with complete arguments.";

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

  /* Image (one per turn, latest user message only). Any other message
     carrying an image is a malformed request. The payload is re-validated
     here (type by bytes, size, dimensions, base64 only); a reject gets one
     generic line, and the log carries the reason code, never the data. */
  const lastIndex = messages.length - 1;
  const hasImage = (m: unknown) => {
    const image = (m as Record<string, unknown>).image;
    return image !== undefined && image !== null;
  };
  let turnImage: ChatImagePayload | null = null;
  for (let i = 0; i < messages.length; i++) {
    if (!hasImage(messages[i])) continue;
    const msg = messages[i] as unknown as { role: string; image: unknown };
    if (i !== lastIndex || msg.role !== "user") {
      console.warn("[api/chat] image rejected: reason=not-latest-user-message");
      return new Response(
        JSON.stringify({ error: IMAGE_REJECTED_ERROR }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    /* Defensive: a validator throw must still be a 400, never a 500. */
    let check: ReturnType<typeof validateImagePayload>;
    try {
      check = validateImagePayload(msg.image);
    } catch {
      check = { ok: false, reason: "shape" };
    }
    if (!check.ok) {
      console.warn(`[api/chat] image rejected: reason=${check.reason}`);
      return new Response(
        JSON.stringify({ error: IMAGE_REJECTED_ERROR }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log(`[api/chat] image accepted: type=${check.image.mediaType} bytes=${check.bytes} size=${check.width}x${check.height}`);
    turnImage = check.image;
  }

  /* Only role + content go to the API: the image key is stripped from the
     message and, when present, re-attached as an image block ahead of the
     text on the latest turn. Text-only requests are unchanged. */
  const validatedMessages: Anthropic.MessageParam[] = (
    messages as { role: "user" | "assistant"; content: string }[]
  ).map((m, i) =>
    turnImage && i === lastIndex
      ? { role: m.role, content: [imageContentBlock(turnImage), { type: "text" as const, text: m.content }] }
      : { role: m.role, content: m.content },
  );
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
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: buildSystemPrompt((designSystem as string | undefined) ?? "salt"),
      cache_control: { type: "ephemeral" },
    },
  ];

  const encoder = new TextEncoder();

  /* The canvas tools run in the BROWSER (applyAIActions), after the stream
     ends, so the route has no real tool result to return. Left unanswered,
     the API ends the turn at the model's first batch of calls (stop_reason
     "tool_use"): a build that opened with clearCanvas stopped right there
     and the user was left with an emptied canvas and nothing added.

     So the route keeps the turn going itself: each step's calls are
     acknowledged with a tool_result and the conversation is sent back until
     the model stops asking for tools. The client protocol is unchanged - it
     still sees one stream of text and {tool_use} frames, in order. */
  const conversation: Anthropic.MessageParam[] = [...validatedMessages];

  const readable = new ReadableStream({
    async start(controller) {
      const send = (frame: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      /* Text from a later step is set apart from an earlier step's text so
         the bubble does not read "On it.Added the chart." */
      let textSent = false;
      /* True while the model still wants tools when the loop ends. */
      let cutByCap = false;
      const startedAt = Date.now();
      try {
        for (let step = 0; step < MAX_TOOL_STEPS; step++) {
          cutByCap = false;
          const stream = await anthropic.messages.stream({
            model: MODEL_ID,
            max_tokens: 16000,
            tools: CANVAS_TOOLS,
            system,
            /* A copy: the array grows between steps. */
            messages: [...conversation],
          });

          /* Tool-use blocks arrive as content_block_start (name) → N
             input_json_delta fragments → content_block_stop. Accumulate per
             block index and emit one `{tool_use: {name, input}}` frame when
             the block closes, in the order the model emitted them (order
             matters: setZoneLayout before addBlock). */
          const pendingTools = new Map<number, { id: string; name: string; json: string }>();
          /* This step's assistant content and the acknowledgements owed for
             it, replayed to the API if the model stops for tool results. */
          const assistantContent: Anthropic.ContentBlockParam[] = [];
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          let stepText = "";
          let stepTextStarted = false;
          let stopReason: string | null = null;

          for await (const event of stream) {
            /* Cache-hit telemetry: message_start carries the input-token
               usage, incl. cache_read / cache_creation. Logged per model
               request so the prompt-cache can be confirmed working
               (cache_read > 0 after the first warm-up). Server-side only;
               never reaches the client. */
            if (event.type === "message_start") {
              const u = event.message.usage;
              console.log(
                `[api/chat] step=${step} cache_read=${u.cache_read_input_tokens ?? 0} ` +
                  `cache_creation=${u.cache_creation_input_tokens ?? 0} ` +
                  `input=${u.input_tokens}`,
              );
            }
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              if (!stepTextStarted) {
                stepTextStarted = true;
                if (textSent) send({ text: "\n\n" });
              }
              textSent = true;
              stepText += event.delta.text;
              send({ text: event.delta.text });
            } else if (
              event.type === "content_block_start" &&
              event.content_block.type === "tool_use"
            ) {
              if (stepText) {
                assistantContent.push({ type: "text", text: stepText });
                stepText = "";
              }
              pendingTools.set(event.index, {
                id: event.content_block.id,
                name: event.content_block.name,
                json: "",
              });
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
                /* Should not happen with buffered input streaming; if it
                   does, tell the client which call was lost rather than
                   dropping it, and tell the model so it can send it again. */
                send({ tool_skipped: { name: pending.name, reason: "invalid tool input JSON" } });
                assistantContent.push({ type: "tool_use", id: pending.id, name: pending.name, input: {} });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: pending.id,
                  is_error: true,
                  content: TOOL_REJECTED,
                });
                continue;
              }
              send({ tool_use: { name: pending.name, input } });
              assistantContent.push({ type: "tool_use", id: pending.id, name: pending.name, input });
              toolResults.push({ type: "tool_result", tool_use_id: pending.id, content: TOOL_QUEUED });
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? null;
            }
          }

          if (stopReason !== "tool_use" || toolResults.length === 0) break;
          cutByCap = true;
          if (stepText) assistantContent.push({ type: "text", text: stepText });
          conversation.push({ role: "assistant", content: assistantContent });
          conversation.push({ role: "user", content: toolResults });
          if (Date.now() - startedAt > TURN_BUDGET_MS) {
            console.log(`[api/chat] time budget reached: step=${step} budget_ms=${TURN_BUDGET_MS}`);
            break;
          }
        }
        if (cutByCap) {
          console.log(`[api/chat] turn cut short: max_steps=${MAX_TOOL_STEPS} image=${turnImage ? 1 : 0}`);
          send({ text: `${textSent ? "\n\n" : ""}${turnImage ? STEP_CAP_NOTE_IMAGE : STEP_CAP_NOTE}` });
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
