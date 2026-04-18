/**
 * Mock-content generator for builder templates.
 * Given a list of canvas blocks, asks Claude to produce realistic and
 * varied display values (labels, amounts, titles, etc.) for each one.
 * The client then applies the returned patches to its blocks so the
 * preview feels demo-ready and not like a static template.
 *
 * Contract:
 *   POST /api/builder/generate-content
 *   body: { templateId: string, blocks: Array<{ id, type, props }> }
 *   response: { patches: Array<{ id, props: Record<string, unknown> }> }
 *
 * Non-streaming - the response is small (<2KB) and the client wants
 * the whole JSON before patching.
 */

import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_BLOCKS = 40;
const MAX_TEMPLATE_ID_LENGTH = 60;

interface IncomingBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

function isValidBlock(b: unknown): b is IncomingBlock {
  if (typeof b !== "object" || b === null) return false;
  const blk = b as Record<string, unknown>;
  return (
    typeof blk.id === "string" &&
    blk.id.length > 0 &&
    blk.id.length < 120 &&
    typeof blk.type === "string" &&
    blk.type.length > 0 &&
    blk.type.length < 80 &&
    typeof blk.props === "object" &&
    blk.props !== null
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

const SYSTEM_PROMPT = `You are a mock-data generator for a SaaS UI builder. You receive a list of blocks with their current display props and return realistic, varied replacement values.

Rules:
- Change only display text/values, never visual structure.
- Keep the block "id" and "type" exactly as given.
- NEVER change these props: colSpan, defaultOn, defaultChecked, presence, size, variant, level, icon, active, showIcon, chartType, status.
- Return only blocks you are changing; omit untouched ones.
- Return STRICT JSON. No prose. No markdown fences. No trailing commas.

What to vary per block type:
- SimulatedStatCard   → {label, value, pct}. Realistic business metrics (MRR, ARR, Active Users, Churn, NPS, Conversion, AOV, Paid, Trial, LTV, CAC). Vary all three. pct is a small integer, can be negative.
- SimulatedTitle      → {text}. Concise section titles, max 40 chars. No trailing punctuation.
- SimulatedTextInput  → {label, placeholder}. Keep label semantic; placeholder shows a plausible sample.
- SimulatedButton     → {label}. Action verb, max 20 chars.
- AppBrand            → {label}. A plausible product or app name, max 20 chars.
- StatusPill          → {label}. Short status (Live, Beta, Draft, Active, Signed in). Max 12 chars.
- NavItem             → {label}. Nav item label, max 16 chars.
- FooterText          → {label, version}. Realistic footer string + version / legal links.
- Alert               → {title, message}. Contextually appropriate; match variant tone.
- SimulatedSearchbox  → {placeholder}. Hint text matching the surrounding context.
- SimulatedDropdown   → {placeholder}. Realistic filter label.
- SimulatedAvatar     → {initials}. Two letters.
- SimulatedProgress   → {label, value}. value is 0-100. Realistic usage copy.
- SimulatedCheckbox   → {label}.
- SimulatedSwitch     → {label}.
- SimulatedLink       → {text}.
- SimulatedBadge      → {label}.
- SimulatedPill       → {label}.
- HighchartArea|Column|Line|Bar|Pie|Donut|Spline|StackedColumn|Gauge|Heatmap|Treemap → {title}. Concise chart title, max 40 chars.

Output shape:
{
  "patches": [
    { "id": "<exact block id>", "props": { <only changed props> } },
    ...
  ]
}`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting - content regen is cheap but still hits Claude.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit(ip);
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

  const { templateId, blocks } = body as Record<string, unknown>;

  if (typeof templateId !== "string" || templateId.length === 0 || templateId.length > MAX_TEMPLATE_ID_LENGTH) {
    return new Response(
      JSON.stringify({ error: "templateId must be a non-empty string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(blocks) || blocks.length === 0 || blocks.length > MAX_BLOCKS) {
    return new Response(
      JSON.stringify({ error: `blocks must be a non-empty array of <=${MAX_BLOCKS} items` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!blocks.every(isValidBlock)) {
    return new Response(
      JSON.stringify({ error: "Each block must have id (string), type (string), and props (object)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const anthropic = getClient(apiKey);

  const userMessage = `Template: ${templateId}\n\nBlocks:\n${JSON.stringify(blocks, null, 2)}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract the first text block
    const textBlock = response.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return new Response(
        JSON.stringify({ error: "Claude returned no text content" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse - be tolerant of markdown fences even though we asked for none
    let parsed: unknown;
    const raw = textBlock.text.trim();
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Claude returned malformed JSON", raw: cleaned.slice(0, 500) }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate shape
    const result = parsed as Record<string, unknown>;
    if (!Array.isArray(result.patches)) {
      return new Response(
        JSON.stringify({ error: "Claude response missing patches array" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Filter to known block ids - safety against hallucinated ids
    const blockIds = new Set((blocks as IncomingBlock[]).map((b) => b.id));
    const safePatches = result.patches.filter((p: unknown) => {
      if (typeof p !== "object" || p === null) return false;
      const patch = p as Record<string, unknown>;
      return (
        typeof patch.id === "string" &&
        blockIds.has(patch.id) &&
        typeof patch.props === "object" &&
        patch.props !== null
      );
    });

    return new Response(
      JSON.stringify({ patches: safePatches }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude API error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
