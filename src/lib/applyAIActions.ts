/* ── Apply parsed AI actions to the Zustand store ── */

import { useBuilder } from "@/store/useBuilder";
import type { AIAction } from "./parseAIResponse";
import type { DesignSystem, BuilderMode, InterfaceType, ZoneId, Block, LayoutProps, ZoneLayout } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS } from "./blockRegistry";
import { defaultLayoutForType } from "./blockLayoutDefaults";
import { pushSnapshot } from "./builderHistory";
import { emitToolUse } from "./toolUseEvents";

const VALID_DESIGN_SYSTEMS = ["salt", "m3", "fluent", "uoaui", "carbon"];
const VALID_MODES = ["light", "dark"];
const VALID_DENSITIES = ["high", "medium", "low", "touch"];
const VALID_ZONES: ZoneId[] = ["body", "header", "sidebar", "footer"];
const VALID_INTERFACE_TYPES = ["dashboard", "landing", "form", "ecommerce", "blog", "portfolio"];

/* Runaway guard: a single AI turn should never carpet the canvas with a
   20-30 block dashboard. The system prompt targets a 5-9 block budget; this
   is a hard backstop against prompt drift. Generous enough that it never
   clips a reasonable build, low enough to stop a pathological dump. */
const MAX_ADD_BLOCKS_PER_TURN = 16;

function uid() {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* One action the client could not apply, and why. Surfaced in the chat
   bubble (persisted, so the model sees it next turn) and as a card. */
export interface SkippedAction {
  action: string;
  reason: string;
  blockId?: string;
}

export interface ApplyReport {
  applied: number;
  skipped: SkippedAction[];
}

/* Phase 3a (N4 Tool-Use Cards): pass `messageId` so each parsed
   action emits a `builder:tool-use` event tied to the assistant
   message that produced it. ChatPanel groups events by messageId
   to render <ToolUseCard> children inline below the right bubble.
   Backward-compat: messageId is optional. Callers that don't supply
   one (e.g. tests) still get the side-effects without emit.

   Returns a report of what landed and what did not. Before this, every
   failed guard was a silent `break`: a wrong block id, an invalid zone or
   the add cap produced a turn that "did nothing" with no trail. Each such
   path now records a reason and emits a skipped tool-use event. */
export function applyAIActions(actions: AIAction[], messageId?: string): ApplyReport {
  // Save snapshot before applying any actions (enables undo)
  if (actions.length > 0) pushSnapshot();

  const store = useBuilder.getState();
  const report: ApplyReport = { applied: 0, skipped: [] };

  const skip = (action: AIAction, reason: string, blockId?: string): void => {
    report.skipped.push({ action: action.action, reason, ...(blockId ? { blockId } : {}) });
    emitToolUse({ messageId, action: action.action, value: action.value, status: "skipped", reason, blockId });
  };
  const applied = (): void => {
    report.applied++;
  };
  const quote = (v: unknown): string => (typeof v === "string" ? `"${v}"` : JSON.stringify(v) ?? String(v));

  let addBlockCount = 0;

  for (const action of actions) {
    switch (action.action) {
      case "setDesignSystem":
        if (typeof action.value === "string" && VALID_DESIGN_SYSTEMS.includes(action.value)) {
          store.setDesignSystem(action.value as DesignSystem);
          emitToolUse({ messageId, action: "setDesignSystem", value: action.value });
          applied();
        } else skip(action, `unknown design system ${quote(action.value)}`);
        break;

      case "setMode":
        if (typeof action.value === "string" && VALID_MODES.includes(action.value)) {
          store.setMode(action.value as BuilderMode);
          emitToolUse({ messageId, action: "setMode", value: action.value });
          applied();
        } else skip(action, `unknown mode ${quote(action.value)}`);
        break;

      case "setDensity":
        if (typeof action.value === "string" && VALID_DENSITIES.includes(action.value)) {
          store.setDensity(action.value);
          emitToolUse({ messageId, action: "setDensity", value: action.value });
          applied();
        } else skip(action, `unknown density ${quote(action.value)}`);
        break;

      case "setComponents":
        if (Array.isArray(action.value)) {
          store.setSelectedComponents(action.value);
          emitToolUse({ messageId, action: "setComponents", value: action.value });
          applied();
        } else skip(action, "components must be a list");
        break;

      case "setInterfaceType":
        if (typeof action.value === "string" && VALID_INTERFACE_TYPES.includes(action.value)) {
          store.setInterfaceType(action.value as InterfaceType);
          emitToolUse({ messageId, action: "setInterfaceType", value: action.value });
          applied();
        } else skip(action, `unknown interface type ${quote(action.value)}`);
        break;

      case "setThemeKey":
        if (typeof action.value === "string") {
          store.setThemeKey(action.value);
          emitToolUse({ messageId, action: "setThemeKey", value: action.value });
          applied();
        } else skip(action, "theme key must be a string");
        break;

      case "setColorOverride": {
        const v = action.value as { key?: string; color?: string } | null;
        if (v && typeof v.key === "string" && typeof v.color === "string") {
          store.setColorOverride(v.key, v.color);
          emitToolUse({ messageId, action: "setColorOverride", value: v });
          applied();
        } else skip(action, "needs key and color");
        break;
      }

      case "addBlock": {
        const v = action.value as {
          type?: string;
          zone?: ZoneId;
          index?: number;
          props?: Record<string, unknown>;
          /* New optional layout shape. Accepts any LayoutProps
             fields: width, minWidth, maxWidth, grow, align, margin.
             The resolver validates width strings at render time. */
          layout?: Partial<LayoutProps>;
        } | null;
        if (!v || typeof v.type !== "string") {
          skip(action, "addBlock needs a block type");
          break;
        }
        addBlockCount++;
        if (addBlockCount > MAX_ADD_BLOCKS_PER_TURN) {
          skip(action, `more than ${MAX_ADD_BLOCKS_PER_TURN} blocks in one turn`);
          break;
        }
        const zone: ZoneId = v.zone && VALID_ZONES.includes(v.zone) ? v.zone : "body";
        // Find defaults from registry
        const blueprint = LIBRARY_BLUEPRINTS.find((b) => b.type === v.type);
        if (!blueprint) {
          skip(action, `unknown block type ${quote(v.type)}`);
          break;
        }
        const defaults = blueprint.defaults ?? {};
        /* Phase 3a: stamp `source: 'ai-action'` so N4 cards + future
           audit log can tell AI-emitted blocks from palette drops.
           Field lives on Block (not in props) so sanitizePropValue
           depth doesn't strip. */
        const block: Block = {
          id: uid(),
          type: v.type,
          props: { ...defaults, ...v.props },
          source: "ai-action",
          /* AI-provided layout wins; otherwise stamp the per-type default
             (e.g. checkbox/switch hug content instead of stretching). */
          ...(v.layout
            ? { layout: v.layout as LayoutProps }
            : (() => { const d = defaultLayoutForType(v.type); return d ? { layout: d } : {}; })()),
        };
        store.addBlockToZone(zone, block, v.index);
        /* Phase 3a (N4): emit a tool-use event carrying the new
           block id + zone so the card can wire per-action undo. */
        emitToolUse({
          messageId,
          action: "addBlock",
          value: { type: v.type, zone, index: v.index, props: v.props, layout: v.layout },
          blockId: block.id,
          zone,
        });
        applied();
        break;
      }

      case "removeBlock": {
        const v = action.value as { blockId?: string } | null;
        if (!v || typeof v.blockId !== "string") {
          skip(action, "removeBlock needs a blockId");
          break;
        }
        // Search all zones for the block
        const st = useBuilder.getState();
        const blockId: string = v.blockId;
        let found = false;
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          const target = arr.find((b) => b.id === blockId);
          if (target) {
            store.removeBlockFromZone(zone, blockId);
            /* Phase 3a PR (b): carry the removed block's type so the
               RemoveBlockCard can label it - the block is gone from
               the store by the time the card renders. */
            emitToolUse({
              messageId,
              action: "removeBlock",
              value: { blockId, type: target.type },
              blockId,
              zone,
            });
            applied();
            found = true;
            break;
          }
        }
        if (!found) skip(action, `no block with id ${quote(blockId)}`, blockId);
        break;
      }

      case "moveBlock": {
        const v = action.value as { blockId?: string; toZone?: ZoneId; toIndex?: number } | null;
        if (!v || typeof v.blockId !== "string") {
          skip(action, "moveBlock needs a blockId");
          break;
        }
        if (!v.toZone || !VALID_ZONES.includes(v.toZone)) {
          skip(action, `unknown zone ${quote(v.toZone)}`, v.blockId);
          break;
        }
        // Find which zone the block is currently in
        const st = useBuilder.getState();
        const blockId: string = v.blockId;
        const toZone: ZoneId = v.toZone;
        const toIndex: number = v.toIndex ?? 0;
        let fromZone: ZoneId | null = null;
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === blockId)) { fromZone = zone; break; }
        }
        if (fromZone) {
          store.moveBlockBetweenZones(fromZone, toZone, blockId, toIndex);
          emitToolUse({
            messageId,
            action: "moveBlock",
            value: { blockId, fromZone, toZone, toIndex },
            blockId,
            zone: toZone,
          });
          applied();
        } else skip(action, `no block with id ${quote(blockId)}`, blockId);
        break;
      }

      case "updateBlockProps": {
        const v = action.value as { blockId?: string; props?: Record<string, unknown> } | null;
        if (!v || typeof v.blockId !== "string") {
          skip(action, "updateBlockProps needs a blockId");
          break;
        }
        if (!v.props || typeof v.props !== "object") {
          skip(action, "updateBlockProps needs a props object", v.blockId);
          break;
        }
        // Find which zone the block is in and update
        const st = useBuilder.getState();
        const blockId: string = v.blockId;
        const propsPatch = v.props;
        let found = false;
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === blockId)) {
            store.updateZoneBlockProps(zone, blockId, propsPatch);
            emitToolUse({
              messageId,
              action: "updateBlockProps",
              value: { blockId, props: propsPatch },
              blockId,
              zone,
            });
            applied();
            found = true;
            break;
          }
        }
        if (!found) skip(action, `no block with id ${quote(blockId)}`, blockId);
        break;
      }

      case "clearCanvas": {
        const zone = typeof action.value === "string" && VALID_ZONES.includes(action.value as ZoneId)
          ? action.value as ZoneId : "body";
        store.setZoneBlocks(zone, []);
        emitToolUse({ messageId, action: "clearCanvas", value: zone, zone });
        applied();
        break;
      }

      case "updateBlockLayout": {
        /* Patch a specific block's layout metadata - width, min/max,
           grow, align, margin. Claude uses this when the user asks
           things like "make this card 240px wide" or "set the chart
           to fill the row". */
        const v = action.value as {
          blockId?: string;
          layout?: Partial<LayoutProps>;
        } | null;
        if (!v || typeof v.blockId !== "string") {
          skip(action, "updateBlockLayout needs a blockId");
          break;
        }
        if (!v.layout || typeof v.layout !== "object") {
          skip(action, "updateBlockLayout needs a layout object", v.blockId);
          break;
        }
        const blockId: string = v.blockId;
        const patch: Partial<LayoutProps> = v.layout;
        const st = useBuilder.getState();
        let found = false;
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === blockId)) {
            store.updateBlockLayout(zone, blockId, patch);
            emitToolUse({
              messageId,
              action: "updateBlockLayout",
              value: { blockId, layout: patch },
              blockId,
              zone,
            });
            applied();
            found = true;
            break;
          }
        }
        if (!found) skip(action, `no block with id ${quote(blockId)}`, blockId);
        break;
      }

      case "setZoneLayout": {
        /* Switch a zone between Stack / Row / Grid, or tweak its
           gap / padding / wrap / align. Claude uses this for
           "turn the body into a 4-column grid" or "stack the
           sidebar vertically with 4px gap". */
        const v = action.value as {
          zone?: ZoneId;
          layout?: Partial<ZoneLayout>;
        } | null;
        if (!v || !v.zone || !VALID_ZONES.includes(v.zone)) {
          skip(action, `unknown zone ${quote(v?.zone)}`);
          break;
        }
        if (!v.layout || typeof v.layout !== "object") {
          skip(action, "setZoneLayout needs a layout object");
          break;
        }
        store.setZoneLayout(v.zone, v.layout);
        emitToolUse({
          messageId,
          action: "setZoneLayout",
          value: { zone: v.zone, layout: v.layout },
          zone: v.zone,
        });
        applied();
        break;
      }

      default:
        skip(action, `unknown action ${quote((action as { action: unknown }).action)}`);
    }
  }

  /* After applying the whole batch, drop any selection that now points at a
     block the AI deleted (removeBlock / clearCanvas, in any order). Reconciling
     ONCE against the FINAL canvas state — by block existence, not per-action
     id/zone guards — is what makes this robust to multi-selection, group-child
     selections, and a [moveBlock, clearCanvas] batch that leaves selectedBlockZone
     stale. No-op when the selection is empty or fully intact. */
  if (actions.length > 0) store.reconcileSelection();
  return report;
}
