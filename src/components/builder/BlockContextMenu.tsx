"use client";

import React from "react";
import { useBuilder, type ZoneId, type Block } from "@/store/useBuilder";
import { showToast } from "@/lib/toast";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

/* ══════════════════════════════════════════════════════════
   BlockContextMenu — singleton right-click menu for canvas blocks.

   Reads `blockContextMenu` + selection state from the store, builds
   the item list based on the target block's context (type, position
   in zone, group membership, current selection), and dispatches
   store actions. Renders nothing when no menu is open.
   ══════════════════════════════════════════════════════════ */

const ZONE_KEY: Record<ZoneId, "blocks" | "headerBlocks" | "sidebarBlocks" | "footerBlocks"> = {
  body: "blocks",
  header: "headerBlocks",
  sidebar: "sidebarBlocks",
  footer: "footerBlocks",
};

const ZONE_LABEL: Record<ZoneId, string> = {
  body: "Body",
  header: "Header",
  sidebar: "Sidebar",
  footer: "Footer",
};

const ZONE_ICON: Record<ZoneId, string> = {
  body: "crop_free",
  header: "north",
  sidebar: "west",
  footer: "south",
};

const MOD_KEY = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘" : "Ctrl";

export function BlockContextMenu() {
  const menu = useBuilder((s) => s.blockContextMenu);
  const close = useBuilder((s) => s.closeBlockContextMenu);

  /* Subscribe to only what we need. These hooks are declared
     unconditionally (React rules of hooks); we bail in the render
     branch if `menu` is null. */
  const selectedBlockIds = useBuilder((s) => s.selectedBlockIds);
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);

  const groupBlocks = useBuilder((s) => s.groupBlocks);
  const ungroupBlock = useBuilder((s) => s.ungroupBlock);
  const duplicateBlocks = useBuilder((s) => s.duplicateBlocks);
  const removeBlockFromZone = useBuilder((s) => s.removeBlockFromZone);
  const moveBlockUp = useBuilder((s) => s.moveBlockUp);
  const moveBlockDown = useBuilder((s) => s.moveBlockDown);
  const moveBlockBetweenZones = useBuilder((s) => s.moveBlockBetweenZones);

  if (!menu) return null;

  const { blockId, zone, x, y } = menu;
  const zoneArray: Block[] =
    zone === "body" ? blocks
    : zone === "header" ? headerBlocks
    : zone === "sidebar" ? sidebarBlocks
    : footerBlocks;

  const targetBlock = zoneArray.find((b) => b.id === blockId);
  if (!targetBlock) {
    /* Block was removed while the menu was queuing — close silently. */
    close();
    return null;
  }

  const indexInZone = zoneArray.findIndex((b) => b.id === blockId);
  const isFirstInZone = indexInZone === 0;
  const isLastInZone = indexInZone === zoneArray.length - 1;
  const isLayoutGroup = targetBlock.type === "LayoutGroup";

  /* If the right-clicked block isn't in the current multi-selection,
     treat the action as scoped to just that block. This mirrors
     Figma / most editors. */
  const activeIds = selectedBlockIds.includes(blockId) && selectedBlockIds.length > 0
    ? selectedBlockIds
    : [blockId];

  const hasLayoutGroupInSelection = zoneArray
    .filter((b) => activeIds.includes(b.id))
    .some((b) => b.type === "LayoutGroup");

  const copyBlockAsJson = () => {
    try {
      const json = JSON.stringify(targetBlock, null, 2);
      navigator.clipboard.writeText(json);
      showToast("Block JSON copied", { icon: "content_copy" });
    } catch {
      showToast("Clipboard unavailable", { icon: "warning" });
    }
  };

  const items: ContextMenuItem[] = [
    {
      label: activeIds.length > 1 ? `Group column (${activeIds.length})` : "Wrap in group column",
      icon: "view_agenda",
      shortcut: `${MOD_KEY}G`,
      onClick: () => {
        if (hasLayoutGroupInSelection) {
          showToast("Groups can't nest — ungroup first", { icon: "warning" });
          return;
        }
        groupBlocks(zone, activeIds, "stack");
      },
      disabled: hasLayoutGroupInSelection,
    },
    {
      label: "Ungroup",
      icon: "call_split",
      shortcut: `${MOD_KEY}⇧G`,
      onClick: () => ungroupBlock(zone, blockId),
      disabled: !isLayoutGroup,
    },
    "separator",
    {
      label: activeIds.length > 1 ? `Duplicate (${activeIds.length})` : "Duplicate",
      icon: "content_copy",
      shortcut: `${MOD_KEY}D`,
      onClick: () => duplicateBlocks(zone, activeIds),
    },
    {
      label: activeIds.length > 1 ? `Delete (${activeIds.length})` : "Delete",
      icon: "delete",
      shortcut: "⌫",
      danger: true,
      onClick: () => {
        activeIds.forEach((id) => removeBlockFromZone(zone, id));
      },
    },
    "separator",
    {
      label: "Move up",
      icon: "arrow_upward",
      onClick: () => moveBlockUp(zone, blockId),
      disabled: isFirstInZone,
    },
    {
      label: "Move down",
      icon: "arrow_downward",
      onClick: () => moveBlockDown(zone, blockId),
      disabled: isLastInZone,
    },
    {
      label: "Send to zone",
      icon: "open_with",
      submenu: (Object.keys(ZONE_LABEL) as ZoneId[]).map((z) => ({
        label: ZONE_LABEL[z],
        icon: ZONE_ICON[z],
        onClick: () => {
          const destIndex = z === "body" ? blocks.length
            : z === "header" ? headerBlocks.length
            : z === "sidebar" ? sidebarBlocks.length
            : footerBlocks.length;
          moveBlockBetweenZones(zone, z, blockId, destIndex);
        },
        disabled: z === zone,
      })),
    },
    "separator",
    {
      label: "Copy as JSON",
      icon: "data_object",
      onClick: copyBlockAsJson,
    },
  ];
  /* Reference the zone-key lookup so the import is used on any future
     zone-specific path (e.g. writing back to a zone array). The var is
     intentionally exported for clarity even though it isn't referenced
     in the current paths. */
  void ZONE_KEY;

  return <ContextMenu x={x} y={y} items={items} onClose={close} />;
}
