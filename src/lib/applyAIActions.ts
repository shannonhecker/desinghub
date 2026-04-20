/* ── Apply parsed AI actions to the Zustand store ── */

import { useBuilder } from "@/store/useBuilder";
import type { AIAction } from "./parseAIResponse";
import type { DesignSystem, BuilderMode, InterfaceType, ZoneId, Block, LayoutProps, ZoneLayout } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS } from "./blockRegistry";
import { pushSnapshot } from "@/store/useBuilderHistory";

const VALID_DESIGN_SYSTEMS = ["salt", "m3", "fluent", "ausos", "carbon"];
const VALID_MODES = ["light", "dark"];
const VALID_DENSITIES = ["high", "medium", "low", "touch"];
const VALID_ZONES: ZoneId[] = ["body", "header", "sidebar", "footer"];
const VALID_INTERFACE_TYPES = ["dashboard", "landing", "form", "ecommerce", "blog", "portfolio"];

function uid() {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function applyAIActions(actions: AIAction[]): void {
  // Save snapshot before applying any actions (enables undo)
  if (actions.length > 0) pushSnapshot();

  const store = useBuilder.getState();

  for (const action of actions) {
    switch (action.action) {
      case "setDesignSystem":
        if (typeof action.value === "string" && VALID_DESIGN_SYSTEMS.includes(action.value)) {
          store.setDesignSystem(action.value as DesignSystem);
        }
        break;

      case "setMode":
        if (typeof action.value === "string" && VALID_MODES.includes(action.value)) {
          store.setMode(action.value as BuilderMode);
        }
        break;

      case "setDensity":
        if (typeof action.value === "string" && VALID_DENSITIES.includes(action.value)) {
          store.setDensity(action.value);
        }
        break;

      case "setComponents":
        if (Array.isArray(action.value)) {
          store.setSelectedComponents(action.value);
        }
        break;

      case "setInterfaceType":
        if (typeof action.value === "string" && VALID_INTERFACE_TYPES.includes(action.value)) {
          store.setInterfaceType(action.value as InterfaceType);
        }
        break;

      case "setThemeKey":
        if (typeof action.value === "string") {
          store.setThemeKey(action.value);
        }
        break;

      case "setColorOverride": {
        const v = action.value as { key?: string; color?: string } | null;
        if (v && typeof v.key === "string" && typeof v.color === "string") {
          store.setColorOverride(v.key, v.color);
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
        const zone: ZoneId = v.zone && VALID_ZONES.includes(v.zone) ? v.zone : "body";
        // Find defaults from registry
        const blueprint = LIBRARY_BLUEPRINTS.find((b) => b.type === v.type);
        const defaults = blueprint?.defaults ?? {};
        const block: Block = {
          id: uid(),
          type: v.type,
          props: { ...defaults, ...v.props },
          ...(v.layout ? { layout: v.layout as LayoutProps } : {}),
        };
        store.addBlockToZone(zone, block, v.index);
        break;
      }

      case "removeBlock": {
        const v = action.value as { blockId?: string } | null;
        if (!v || typeof v.blockId !== "string") break;
        // Search all zones for the block
        const st = useBuilder.getState();
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === v.blockId)) {
            store.removeBlockFromZone(zone, v.blockId);
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
        let fromZone: ZoneId | null = null;
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === v.blockId)) { fromZone = zone; break; }
        }
        if (fromZone) {
          store.moveBlockBetweenZones(fromZone, v.toZone, v.blockId, v.toIndex ?? 0);
        }
        break;
      }

      case "updateBlockProps": {
        const v = action.value as { blockId?: string; props?: Record<string, unknown> } | null;
        if (!v || typeof v.blockId !== "string" || !v.props) break;
        // Find which zone the block is in and update
        const st = useBuilder.getState();
        for (const zone of VALID_ZONES) {
          const key = zone === "body" ? "blocks" : `${zone}Blocks` as "headerBlocks" | "sidebarBlocks" | "footerBlocks";
          const arr = zone === "body" ? st.blocks : st[key];
          if (arr.some((b) => b.id === v.blockId)) {
            store.updateZoneBlockProps(zone, v.blockId, v.props);
            break;
          }
        }
        break;
      }

      case "clearCanvas": {
        const zone = typeof action.value === "string" && VALID_ZONES.includes(action.value as ZoneId)
          ? action.value as ZoneId : "body";
        store.setZoneBlocks(zone, []);
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
        break;
      }
    }
  }
}
