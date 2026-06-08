/**
 * AI table-data generator for the SimulatedDataTable block.
 *
 * Given a natural-language description ("5 users with status and role"),
 * asks Claude for realistic {columns, rows} which the client writes to the
 * block's props — fulfilling the block's "Describe the records you want"
 * empty-state promise. Mirrors generate-content's shape (rate-limit,
 * validate, call, tolerant-parse) but narrowed to one block and hardened
 * by sanitizeGeneratedTable (the AI output is rendered into the DOM, so it
 * is treated as untrusted: bounded counts, all-string cells).
 *
 * Contract:
 *   POST /api/builder/generate-table
 *   body: { description: string }
 *   response: { columns: string[], rows: string[][] }  (or { error })
 */

import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { MODEL_ID } from "@/lib/chatSystem";
import { sanitizeGeneratedTable, MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "@/lib/tableData";

const MAX_DESCRIPTION_LEN = 500;

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

const SYSTEM_PROMPT = `You generate realistic tabular data for a SaaS UI builder's data-table block.

The user describes the records they want; you return realistic, varied sample data.

Rules:
- Return STRICT JSON. No prose, no markdown fences, no trailing commas.
- At most ${MAX_TABLE_COLUMNS} columns. Concise column headers (1-2 words).
- 5 to 10 rows unless the user asks for a specific count (never more than ${MAX_TABLE_ROWS}).
- Every row is an array of strings, one cell per column, in column order.
- Keep cell values short and plausible. Status-like columns use short states (Active, Away, Pending, Done).

Output shape:
{
  "columns": ["Name", "Status", "Role"],
  "rows": [
    ["Ava Chen", "Active", "Lead"],
    ["Sam Okoro", "Away", "Engineer"]
  ]
}`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "ANTHROPIC_API_KEY not configured" }, 503);
  }

  // Rate limiting — each call hits Claude.
  const ip = getClientIp(req);
  const limit = await checkRateLimit(ip, "generate-table");
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(limit.resetInSeconds) },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { description } = body as Record<string, unknown>;
  if (
    typeof description !== "string" ||
    description.trim().length === 0 ||
    description.length > MAX_DESCRIPTION_LEN
  ) {
    return json({ error: `description must be a non-empty string up to ${MAX_DESCRIPTION_LEN} chars` }, 400);
  }

  const anthropic = getClient(apiKey);
  try {
    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: description.trim() }],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return json({ error: "Claude returned no text content" }, 502);
    }

    // Tolerant of markdown fences even though the prompt forbids them.
    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return json({ error: "Claude returned malformed JSON" }, 502);
    }

    const table = sanitizeGeneratedTable(parsed);
    if (!table) {
      return json({ error: "Claude returned no usable table data" }, 502);
    }

    return json(table, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude API error";
    return json({ error: msg }, 502);
  }
}
