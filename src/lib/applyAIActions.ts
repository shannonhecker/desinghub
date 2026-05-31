/* ── Apply parsed AI actions to the Zustand store ── */

import { useBuilder } from "@/store/useBuilder";
import type { AIAction } from "./parseAIResponse";
import type { DesignSystem, BuilderMode, InterfaceType, ZoneId, Block, LayoutProps, ZoneLayout } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS } from "./blockRegistry";
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

/* Phase 3a (N4 Tool-Use Cards): pass `messageId` so each parsed
   action emits a `builder:tool-use` event tied to the assistant
   message that produced it. ChatPanel groups events by messageId
   to render <ToolUseCard> children inline below the right bubble.
   Backward-compat: messageId is optional. Callers that don't supply
   one (e.g. tests) still get the side-effects without emit. */
export function applyAIActions(actions: AIAction[], messageId?: string): void {
  // Save snapshot before applying any actions (enables undo)
  if (actions.length > 0) pushSnapshot();

  const store = useBuilder.getState();

  let addBlockCount = 0;
  let addBlockCapWarned = false;

  for (const action of actions) {
    switch (action.action) {
      case "setDesignSystem":
        if (typeof action.value === "string" && VALID_DESIGN_SYSTEMS.includes(action.value)) {
          store.setDesignSystem(action.value as DesignSystem);
          emitToolUse({ messageId, action: "setDesignSystem", value: action.value });
        }
        break;

      case "setMode":
        if (typeof action.value === "string" && VALID_MODES.includes(action.value)) {
          store.setMode(action.value as BuilderMode);
          emitToolUse({ messageId, action: "setMode", value: action.value });
        }
        break;

      case "setDensity":
        if (typeof action.value === "string" && VALID_DENSITIES.includes(action.value)) {
          store.setDensity(action.value);
          emitToolUse({ messageId, action: "setDensity", value: action.value });
        }
        break;

      case "setComponents":
        if (Array.isArray(action.value)) {
          store.setSelectedComponents(action.value);
          emitToolUse({ messageId, action: "setComponents", value: action.value });
        }
        break;

      case "setInterfaceType":
        if (typeof action.value === "string" && VALID_INTERFACE_TYPES.includes(action.value)) {
          store.setInterfaceType(action.value as InterfaceType);
          emitToolUse({ messageId, action: "setInterfaceType", value: action.value });
        }
        break;

      case "setThemeKey":
        if (typeof action.value === "string") {
          store.setThemeKey(action.value);
          emitToolUse({ messageId, action: "setThemeKey", value: action.value });
        }
        break;

      case "setColorOverride": {
        const v = action.value as { key?: string; color?: string } | null;
        if (v && typeof v.key === "string" && typeof v.color === "string") {
          store.setColorOverride(v.key, v.color);
          emitToolUse({ messageId, action: "setColorOverride", value: v });
        }
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
        if (!v || typeof v.type !== "string") break;
        addBlockCount++;
        if (addBlockCount > MAX_ADD_BLOCKS_PER_TURN) {
          if (!addBlockCapWarned) {
            addBlockCapWarned = true;
            console.warn(
              `[applyAIActions] addBlock cap (${MAX_ADD_BLOCKS_PER_TURN}) reached in one turn; extra blocks ignored to keep generated layouts simple.`,
            );
          }
          break;
        }
        const zone: ZoneId = v.zone && VALID_ZONES.includes(v.zone) ? v.zone : "body";
        // Find defaults from registry
        const blueprint = LIBRARY_BLUEPRINTS.find((b) => b.type === v.type);
        const defaults = blueprint?.defaults ?? {};
        /* Phase 3a: stamp `source: 'ai-action'` so N4 cards + future
           audit log can tell AI-emitted blocks from palette drops.
           Field lives on Block (not in props) so sanitizePropValue
           depth doesn't strip. */
        const block: Block = {
          id: uid(),
          type: v.type,
          props: { ...defaults, ...v.props },
          source: "ai-action",
          ...(v.layout ? { layout: v.layout as LayoutProps } : {}),
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
        break;
      }

      case "removeBlock": {
        const v = action.value as { blockId?: string } | null;
        if (!v || typeof v.blockId !== "string") break;
        // Search all zones for the block
        const st = useBuilder.getState();
        const blockId: string = v.blockId;
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === blockId)) {
            store.removeBlockFromZone(zone, blockId);
            emitToolUse({ messageId, action: "removeBlock", value: { blockId }, blockId, zone });
            break;
          }
        }
        break;
      }

      case "moveBlock": {
        const v = action.value as { blockId?: string; toZone?: ZoneId; toIndex?: number } | null;
        if (!v || typeof v.blockId !== "string" || !v.toZone || !VALID_ZONES.includes(v.toZone)) break;
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
        }
        break;
      }

      case "updateBlockProps": {
        const v = action.value as { blockId?: string; props?: Record<string, unknown> } | null;
        if (!v || typeof v.blockId !== "string" || !v.props) break;
        // Find which zone the block is in and update
        const st = useBuilder.getState();
        const blockId: string = v.blockId;
        const propsPatch = v.props;
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
            break;
          }
        }
        break;
      }

      case "clearCanvas": {
        const zone = typeof action.value === "string" && VALID_ZONES.includes(action.value as ZoneId)
          ? action.value as ZoneId : "body";
        store.setZoneBlocks(zone, []);
        emitToolUse({ messageId, action: "clearCanvas", value: zone, zone });
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
        if (!v || typeof v.blockId !== "string" || !v.layout) break;
        const blockId: string = v.blockId;
        const patch: Partial<LayoutProps> = v.layout;
        const st = useBuilder.getState();
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
            break;
          }
        }
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
        if (!v || !v.zone || !VALID_ZONES.includes(v.zone) || !v.layout) break;
        store.setZoneLayout(v.zone, v.layout);
        emitToolUse({
          messageId,
          action: "setZoneLayout",
          value: { zone: v.zone, layout: v.layout },
          zone: v.zone,
        });
        break;
      }
    }
  }

  /* After applying the whole batch, drop any selection that now points at a
     block the AI deleted (removeBlock / clearCanvas, in any order). Reconciling
     ONCE against the FINAL canvas state — by block existence, not per-action
     id/zone guards — is what makes this robust to multi-selection, group-child
     selections, and a [moveBlock, clearCanvas] batch that leaves selectedBlockZone
     stale. No-op when the selection is empty or fully intact. */
  if (actions.length > 0) store.reconcileSelection();
}
