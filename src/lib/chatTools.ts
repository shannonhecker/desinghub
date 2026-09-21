/**
 * chatTools - the builder's canvas actions as Anthropic tool definitions.
 *
 * Until now the model made changes by writing ```json fences in its prose,
 * which the client regex-parsed. That path had no schema: a misspelt field,
 * a string where an object was expected, or a stray comma silently dropped
 * the change. Tool use gives each action a name and a JSON schema the API
 * shows the model, and returns the call as a structured `tool_use` block
 * with parsed `input` - no fence parsing, no prose contamination.
 *
 * The client applies each call through the same `applyAIActions` switch as
 * before, so this module also maps a tool call back onto the legacy
 * `{ action, value }` shape (`toolUseToAction`). Tool names ARE the action
 * names, so the two stay in lockstep; a test pins that.
 *
 * Strictness: the schemas are model-guided, not API-enforced. Strict tool use
 * (`strict: true`) requires `additionalProperties: false` on every object,
 * which rules out the free-form per-block `props` bag, and is only available
 * on the newer model tier; the project's chat model is outside it. The client
 * remains the validator of record (block existence, enums, caps), and now
 * reports what it could not apply instead of dropping it.
 *
 * Pure module: no store, no React, no SDK runtime import (type only), so the
 * route (server) and useChatAPI (client) can both import it.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { AIAction } from "./parseAIResponse";

export const TOOL_ZONES = ["body", "header", "sidebar", "footer"] as const;
export const TOOL_DESIGN_SYSTEMS = ["salt", "m3", "fluent", "carbon", "uoaui"] as const;
export const TOOL_MODES = ["light", "dark"] as const;
export const TOOL_DENSITIES = ["high", "medium", "low", "touch"] as const;
export const TOOL_INTERFACE_TYPES = ["dashboard", "landing", "form", "ecommerce", "blog", "portfolio"] as const;

type Schema = Record<string, unknown>;

const obj = (properties: Record<string, Schema>, required: string[] = [], description?: string): Anthropic.Tool.InputSchema => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
  ...(description ? { description } : {}),
});

const str = (description: string, enumValues?: readonly string[]): Schema =>
  enumValues ? { type: "string", enum: [...enumValues], description } : { type: "string", description };

const WIDTH: Schema = {
  type: "string",
  description: '"fill" (take remaining space) | "auto" (hug contents) | "{N}px" | "{N}%" | "{N}fr" (grid fraction)',
};

const BLOCK_LAYOUT_SCHEMA: Schema = {
  type: "object",
  description: "Per-block sizing and alignment. All fields optional.",
  properties: {
    width: WIDTH,
    minWidth: { ...WIDTH, description: "Floor on computed width, e.g. \"200px\"" },
    maxWidth: { ...WIDTH, description: "Cap on computed width, e.g. \"480px\"" },
    height: { ...WIDTH, description: 'Height: "auto" (hug) | "fill" | "{N}px"' },
    grow: { type: "integer", enum: [0, 1], description: "flex-grow override; 1 lets a fixed-width block expand" },
    align: str("Cross-axis alignment", ["start", "center", "end", "stretch"]),
    margin: { type: "number", description: "Margin in px, all sides" },
    gridCol: { type: "integer", description: "Grid column start line (1-12); grid-mode zones only" },
  },
  additionalProperties: false,
};

const ZONE_LAYOUT_SCHEMA: Schema = {
  type: "object",
  description: "Zone flow settings. All fields optional; omitted fields keep their value.",
  properties: {
    mode: str('"stack" (vertical) | "row" (horizontal, wraps) | "grid"', ["stack", "row", "grid"]),
    columns: { type: "integer", description: "Grid column count (1-12); grid mode only" },
    gap: { type: "number", description: "Gap between children in px" },
    padding: { type: "number", description: "Padding inside the zone in px" },
    wrap: { type: "boolean", description: "Row mode: wrap children onto new lines" },
    align: str("Cross-axis alignment", ["start", "center", "end", "stretch"]),
    justify: str("Main-axis distribution", ["start", "center", "end", "space-between", "space-around"]),
  },
  additionalProperties: false,
};

const PROPS_SCHEMA: Schema = {
  type: "object",
  description:
    "Props for the block type, as listed under Available Block Types (e.g. label, title, text, variant, columns/rows for tables, seriesColors for charts). Only include props you are setting.",
  additionalProperties: true,
};

const BLOCK_ID: Schema = str("Block id copied from the canvas manifest. Never invent one.");
const ZONE: Schema = str("Canvas zone", TOOL_ZONES);

/**
 * The 14 canvas tools. Order is stable (it is part of the cached prompt
 * prefix), and every name matches an `AIAction["action"]`.
 */
export const CANVAS_TOOLS: Anthropic.Tool[] = [
  {
    name: "setDesignSystem",
    description: "Switch the whole canvas to another design system.",
    input_schema: obj({ value: str("Design system", TOOL_DESIGN_SYSTEMS) }, ["value"]),
  },
  {
    name: "setMode",
    description: "Switch between light and dark mode.",
    input_schema: obj({ value: str("Colour mode", TOOL_MODES) }, ["value"]),
  },
  {
    name: "setDensity",
    description: "Set the shared density level. high = tight, medium = default, low = roomy, touch = largest targets (Carbon maps low/touch to spacious).",
    input_schema: obj({ value: str("Density level", TOOL_DENSITIES) }, ["value"]),
  },
  {
    name: "setThemeKey",
    description: "Pick a named theme of the active design system, e.g. Salt jpm-dark/jpm-light, Carbon white/g10/g90/g100.",
    input_schema: obj({ value: str("Theme key") }, ["value"]),
  },
  {
    name: "setInterfaceType",
    description: "Declare what kind of interface is being built. Call once before adding blocks for a fresh build.",
    input_schema: obj({ value: str("Interface type", TOOL_INTERFACE_TYPES) }, ["value"]),
  },
  {
    name: "setComponents",
    description: "Set the onboarding component categories (e.g. buttons, inputs, cards). Rarely needed; prefer addBlock.",
    input_schema: obj({ value: { type: "array", items: { type: "string" }, description: "Component category ids" } }, ["value"]),
  },
  {
    name: "setColorOverride",
    description: "Override one semantic colour slot (e.g. accent) with a CSS colour.",
    input_schema: obj({ key: str("Colour slot, e.g. accent"), color: str("CSS colour, hex preferred, e.g. #6750A4") }, ["key", "color"]),
  },
  {
    name: "addBlock",
    description:
      "Add one block to a zone. Provide realistic, domain-specific props and a layout width so rows fill to 100%. For a row of N equal cards call setZoneLayout grid/N first, then addBlock each with width \"fill\".",
    input_schema: obj(
      {
        type: str("Block type from Available Block Types, e.g. SimulatedStatCard"),
        zone: { ...ZONE, description: 'Target zone; defaults to "body"' },
        index: { type: "integer", description: "0-based insert position within the zone; omit to append" },
        props: PROPS_SCHEMA,
        layout: BLOCK_LAYOUT_SCHEMA,
      },
      ["type"],
    ),
  },
  {
    name: "removeBlock",
    description: "Remove one block by id.",
    input_schema: obj({ blockId: BLOCK_ID }, ["blockId"]),
  },
  {
    name: "moveBlock",
    description:
      'Move a block to a zone and 0-based position. "Up" means the same zone with a smaller toIndex; "to the top" is toIndex 0.',
    input_schema: obj({ blockId: BLOCK_ID, toZone: { ...ZONE, description: "Destination zone" }, toIndex: { type: "integer", description: "0-based destination position" } }, ["blockId", "toZone", "toIndex"]),
  },
  {
    name: "updateBlockProps",
    description: "Change one block's props (label, title, value, seriesColors, rows, ...). Only include the props being changed.",
    input_schema: obj({ blockId: BLOCK_ID, props: PROPS_SCHEMA }, ["blockId", "props"]),
  },
  {
    name: "updateBlockLayout",
    description: 'Change one block\'s sizing or alignment, e.g. width "240px" or "fill".',
    input_schema: obj({ blockId: BLOCK_ID, layout: BLOCK_LAYOUT_SCHEMA }, ["blockId", "layout"]),
  },
  {
    name: "setZoneLayout",
    description: 'Change a zone\'s flow: stack / row / grid (with columns), gap, padding, alignment.',
    input_schema: obj({ zone: ZONE, layout: ZONE_LAYOUT_SCHEMA }, ["zone", "layout"]),
  },
  {
    name: "clearCanvas",
    description: "Remove every block from one zone. Destructive: only when the user explicitly asks to clear or start over.",
    input_schema: obj({ zone: { ...ZONE, description: 'Zone to clear; defaults to "body"' } }, []),
  },
];

export const CANVAS_TOOL_NAMES: readonly string[] = CANVAS_TOOLS.map((t) => t.name);

/* Tools whose single `value` argument IS the legacy action value. */
const SCALAR_VALUE_TOOLS = new Set(["setDesignSystem", "setMode", "setDensity", "setThemeKey", "setInterfaceType", "setComponents"]);

/**
 * Map a `tool_use` block back onto the `{ action, value }` shape that
 * `applyAIActions` consumes. Returns null for a tool name the builder does
 * not know (the API only calls declared tools, so this guards a stale client
 * against a newer server, and the reverse).
 */
export function toolUseToAction(name: string, input: unknown): AIAction | null {
  if (!CANVAS_TOOL_NAMES.includes(name)) return null;
  const action = name as AIAction["action"];
  const obj = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  if (SCALAR_VALUE_TOOLS.has(name)) return { action, value: obj.value };
  if (name === "clearCanvas") return { action, value: typeof obj.zone === "string" ? obj.zone : "body" };
  return { action, value: obj };
}
