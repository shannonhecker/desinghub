import { useBuilder } from "@/store/useBuilder";
import type { SharedCanvas } from "./shareState";
import { pushSnapshot } from "./builderHistory";

/** The caller supplies the confirmation UI; refusal must have no side effects,
 * including theme changes. Check every zone and inactive pages, not just body. */
export function applySharedCanvas(state: SharedCanvas, confirmReplace: () => boolean): boolean {
  const store = useBuilder.getState();
  const hasContent = [store.blocks, store.headerBlocks, store.sidebarBlocks, store.footerBlocks,
    ...store.pages.map(page => page.body)].some(blocks => blocks.length > 0);
  const initial = useBuilder.getInitialState();
  // The fresh builder contains a starter header/sidebar/footer. Only those
  // untouched references are exempt; a saved or edited scaffold is real work.
  const untouched = !store.currentSessionId &&
    (["blocks", "headerBlocks", "sidebarBlocks", "footerBlocks", "pages"] as const)
      .every(key => store[key] === initial[key]);
  if (hasContent && !untouched && !confirmReplace()) return false;

  pushSnapshot();
  store.setDesignSystem(state.designSystem);
  store.setMode(state.mode);
  store.setDensity(state.density);
  store.setCanvasSpacing(state.canvasSpacing);
  store.setDeviceMode(state.deviceMode);
  // Mode derives a DS-specific default theme; an explicit shared theme wins.
  if (state.themeKey) store.setThemeKey(state.themeKey);
  const activePage = state.pages?.find(page => page.id === state.activePageId);
  useBuilder.setState({
    headerBlocks: state.headerBlocks,
    sidebarBlocks: state.sidebarBlocks,
    blocks: state.blocks,
    footerBlocks: state.footerBlocks,
    activeTemplateId: state.activeTemplateId,
    pages: state.pages ?? [],
    activePageId: state.activePageId ?? null,
    zoneLayouts: { ...initial.zoneLayouts, ...(activePage?.bodyLayout ? { body: activePage.bodyLayout } : {}) },
    reportData: null,
    reportState: {},
    expandedPanel: null,
    colorOverrides: {},
    hasOverrides: false,
    selectedComponents: [],
    selectedBlockId: null,
    selectedBlockZone: null,
    selectedBlockIds: [],
    previewOpen: true,
  });
  return true;
}
